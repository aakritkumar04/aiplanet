from sqlalchemy import Column, Integer, String, Date
from database import Base

class UploadPdf(Base):
    __tablename__ = 'uploadedpdf'

    id = Column(Integer,primary_key = True, index=True)
    name = Column(String, nullable=False,index=True)
    date = Column(Date, nullable=False,index = True)