from fastapi import FastAPI,Request,File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.vectorstores import Chroma
from langchain.prompts import ChatPromptTemplate
import google.generativeai as genai
import os
import shutil
import pdfplumber
from dotenv import load_dotenv
load_dotenv()
from model import UploadPdf
from database import engine, SessionLocal, Base
from sqlalchemy.orm import Session
from datetime import date
from sqlalchemy import text
Base.metadata.create_all(bind=engine)
from langchain_cohere import CohereEmbeddings



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

##############################  Variables     ##############################################

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER")
CHROMA_PATH = os.getenv("CHROMA_PATH")
COHERE_EMBEDDINGS = os.getenv("COHERE_EMBEDDINGS")
GOOGLE_API_KEY=os.getenv('GOOGLE_API_KEY')
embeddings = CohereEmbeddings(
    model="embed-english-v3.0",
    cohere_api_key=COHERE_EMBEDDINGS
)

#################################    Template for LLM to understand queries      ###############################################

PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

answer the above text according to question:{question}, else summarize the context.
"""

################################### Generate Embeddings   ##################################
def generate_data_store():
    documents = load_documents()
    chunks = split_text(documents)
    save_to_chroma(chunks)


def load_documents():
    """
        Read all md files.
    """
    loader = DirectoryLoader(UPLOAD_FOLDER, glob="*.md")
    documents = loader.load()
    return documents


def split_text(documents: list[Document]):
    """
        Split the PDF Text into chunks of 300 words and embed them
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=100,
        length_function=len,
        add_start_index=True,
    )
    chunks = text_splitter.split_documents(documents)
    print(f"Split {len(documents)} documents into {len(chunks)} chunks.")
    document = chunks[10]
    return chunks

def save_to_chroma(chunks: list[Document]):
    """
        Create CHROMA DB path and stores the embeddings there.
    """
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)
    db = Chroma.from_documents(
        # chunks, CohereEmbeddings(cohere_api_key=COHERE_EMBEDDINGS), persist_directory=CHROMA_PATH
        chunks, embeddings, persist_directory=CHROMA_PATH
    )
    db.persist()
    print(f"Saved {len(chunks)} chunks to {CHROMA_PATH}.")

#################################### Upload File  #########################################
def create_upload_folder(base_folder: str):
    """
        Create UPLOAD Folder path if does not exist and continue if exists.
    """
    upload_folder = os.path.join(base_folder)
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    return upload_folder

def pdf_to_markdown(pdf_path: str, md_path: str):
    """
        Converts the PDF to Markdown (.md file).
    """
    with pdfplumber.open(pdf_path) as pdf:
        with open(md_path, "w", encoding="utf-8") as md_file:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    md_file.write(f"{text}\n\n")

##################################  LLM   ###########################
def generate(prompt):
    """
        After adding the questions and predicted solutions from the pdf, to
        the Chat Template, it is given to gemini for structuring.
    """
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content(prompt)
    if (response):
        return response.text
    else:
        return ("The data is not sufficient to answer")
    
def query(query1):
    """
        Embeds the query.
        Predicts the possible solution from the PDF given.
        Makes a Structured prompt.
    """
    query_text = query1
    embedding_function = embeddings
    db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
    results = db.similarity_search_with_relevance_scores(query_text, k=5)
    context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
    prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    prompt = prompt_template.format(context=context_text, question=query_text)
    answer = generate(prompt)
    return answer
################################# API's #####################################

@app.post("/upload")
async def uploadPdf(file: UploadFile = File(...)):
    """
        (Func) Convert to Mardown.
        (Func) Convert to embeddings.
        Stores the files to Upload folder (At the server).
        Stores the meta data in the database.

    """
    file_content = await file.read()
    filename = file.filename
    data_path = create_upload_folder(UPLOAD_FOLDER)
    pdf_file_path = os.path.join(data_path, file.filename)
    with open(pdf_file_path, "wb") as f:
        f.write(file_content)
    markdown_file_path = pdf_file_path.replace(".pdf", ".md")
    pdf_to_markdown(pdf_file_path, markdown_file_path)
    generate_data_store()
    db: Session = SessionLocal()
    try:
        if not filename:
            return {"error": "No filename provided"}
        upload_record = UploadPdf(
            name=filename,
            date=date.today()
        )
        db.add(upload_record)
        db.commit()
        return {"message": f"File '{filename}' stored successfully!"}
    except Exception as e:
        db.rollback()
        print("Error occurred:", str(e))
        return {"error": str(e)}
    finally:
        db.close()
        return {"received_body": "recieved "+filename}
    

@app.post("/get_prompt")
async def responsePrompt(request: Request):
    """
        (Func) query.
    """
    data = await request.json()
    text = data.get("message")
    response = query(text)
    return {"output":response}