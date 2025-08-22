Project Setup 🚀
1. Clone or Download the Project
git clone <your-repo-url>
 
 cd <your-project-folder>
2. Initialize Project
 
 npm init -y

3. Install Frontend Dependencies
 
 npm install lucide-react
 
 npm install zustand
 
 npm install react-hook-form
 
 npm install uuid
 
 npm install web-vitals

Tailwind Plugins
 
 npm install -D @tailwindcss/forms @tailwindcss/typography

4. Install Backend Dependencies

 npm install express mongoose dotenv axios cors  
 npm install express@4 
  
  npm install bcrypt 
  
  npm install socket.io 

5. Environment Setup

Create a .env file in the backend root folder and add your MongoDB connection string:

MONGO_URI=your_mongodb_connection_url
 
 PORT=5000

6. Running the Project
Backend
nodemon server.js

Frontend
npm run dev
