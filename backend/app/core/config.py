

from pydantic import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb+srv://categories_db_user:h123@cate.pznk3cx.mongodb.net/?retryWrites=true&w=majority&appName=Cate"
    DATABASE_NAME: str = "cate" 
    SECRET_KEY: str = "your_secret_key"
    SQLALCHEMY_DATABASE_URL: str = "mysql+pymysql://user:password@localhost/dbname" # Placeholder, update with actual creds

settings = Settings()  
 