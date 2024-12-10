
# AI Planet 

A full-stack application that allows users to upload PDF documents and ask questions regarding the content of these documents. The backend will process these documents and utilize natural language processing to provide answers to the questions posed by the users.
Open the directory after downloading it from the repository.
#### https://github.com/aakritkumar04/aiplanet

Install dependencies.

```python
pip3 install -r requirements.txt
```

```python
python3 ntlk.py
```

# Frontend
Open my-app
```
cd my-app
```
Install dependencies
```
npm i --legacy-peer-deps
```
Run the app
```
npm start
```


# Backend
Open backend
```
cd backend
```
Run the Backend
```python
uvicorn app:app --reload
```

# API Documents
1. The given api is to upload a __pdf__ to the server running on  __port 8000__. It can be uploaded through the upload button on 
__http://127.0.0.1:3000__. It converts the pdf to markdown file before pocessing it further. The filename and date is stored in the database __postgresql__. Afterwards it is broken into chunks and embedded. These embeddings are stored in __chroma db__ which is a vector database.
```
    http://127.0.0.1:8000/upload
```

2. The given api is to give the output to the user query. It calls function __query__ which calls __LLM api__ and embeds the query.
```
    http://127.0.0.1:8000/get_prompt
```
Body 
```
{
    "message":"What is this task about?"
}
```

# Connect to the Database
Here is the code provided to connect to postgresql :
```
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "postgresql://username:password@localhost:5432/database"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

```

Define a schema :

```
from sqlalchemy import Column, Integer, String, Date
from database import Base

class UploadPdf(Base):
    __tablename__ = 'uploadedpdf'

    id = Column(Integer,primary_key = True, index=True)
    name = Column(String, nullable=False,index=True)
    date = Column(Date, nullable=False,index = True)
```

# Functions
## Backend
```
1. generate_data_store()
```

To read all md files.
```
2. load_documents()
```

Split the PDF Text into chunks of 300 words and embed them
```
3. split_text(documents: list[Document])
```

Create CHROMA DB path and stores the embeddings there.
```
4. save_to_chroma(chunks: list[Document])
```
Create UPLOAD Folder path if does not exist and continue if exists.
```
5. create_upload_folder(base_folder: str)
```
Converts the uploaded PDF to Markdown (.md file).
```
6. pdf_to_markdown(pdf_path: str, md_path: str)
```

After adding the query and predicted solutions from the pdf, to the Chat Template, it is given to gemini for structuring.

```
7. generate(prompt)
```

Embeds the query.
Predicts the possible solution from the PDF given.
Makes a Structured prompt.
```
8. query(query1)
```

Prompt Template to get structured response from LLM.
```
9. PROMPT_TEMPLATE = """
Answer the question based only on the following context:

{context}

---

answer the above text according to question:{question}, else summarize the context.
"""
```

## Frontend

Send the query to the server to get the solution for the same from the pdf. Also checks if the pdf file is there so no query can be asked without uploading a PDF file.
```
1. handleSendClick()
```

Storing the query of the user
```
2. handleChange
```


Sending PDF file to the server for processing (creating embeddings and storing meta data)
```
3. handleFileChange
```

For animation effect on the upload button
```
4. handleZoom
```

Author : Aakrit Kumar