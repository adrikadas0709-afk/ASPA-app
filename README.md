# Audio Signal Processing Assistant (ASPA)

ASPA is a powerful, full-stack web application designed for audio engineers, electronics students, and hobbyists. It combines interactive audio signal processing tools, circuit design utilities, and a conversational AI assistant powered by **IBM Granite** (via watsonx.ai).

## 🚀 Features

- **Audio Analyzer:** 
  - **File Analysis:** Upload `.wav`, `.mp3`, or `.aac` files to visualize waveforms (using `wavesurfer.js`), view frequency spectrums (via Recharts), and calculate key metrics like Signal-to-Noise Ratio (SNR), Noise Floor, Dynamic Range, and Clipping.
  - **Signal Generator:** Synthesize custom waveforms (Sine, Square, Sawtooth, Triangle, Noise) and adjust frequency, amplitude, and DC offset in real-time.
  - **AI Insights:** Get professional engineering recommendations for your uploaded audio files from the integrated IBM Granite AI model.
- **AI Chat Assistant:** A dedicated conversational agent providing expert guidance on audio engineering, signal processing, and electronic circuit design.
- **Filter & Amplifier Designers:** Interactive modules to design and simulate active/passive filters and audio amplifiers.
- **Circuit Troubleshooter:** Step-by-step diagnostic workflows for common audio electronic issues.
- **Frequency Response Plotter:** Visualize the frequency response of different components and circuits.

## 🛠 Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** CSS & TailwindCSS (via `@tailwindcss/vite`)
- **Animations:** Framer Motion
- **Visualization:** Recharts (Charts) & Wavesurfer.js (Audio Playback)
- **Icons:** React Icons

### Backend
- **Runtime:** Node.js + Express
- **Database:** MongoDB (Mongoose)
- **AI Integration:** IBM watsonx.ai SDK
- **File Handling:** Multer (for audio uploads)
- **Authentication:** JWT (JSON Web Tokens)

## 📁 Project Structure

The repository is divided into two distinct workspaces:
- `/frontend` - The React application.
- `/backend` - The Node.js API server.

## ⚙️ Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB account/cluster
- IBM watsonx.ai credentials (API Key, Project ID)

### 1. Backend Setup

1. Navigate to the backend directory:
   \`\`\`bash
   cd backend
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Create a \`.env\` file based on \`.env.example\` and configure your secrets:
   \`\`\`env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   IBM_WATSONX_URL=https://au-syd.ml.cloud.ibm.com
   IBM_REGION=au-syd
   IBM_API_KEY=your_ibm_api_key
   IBM_PROJECT_ID=your_ibm_project_id
   \`\`\`
4. Start the backend development server:
   \`\`\`bash
   npm run dev
   \`\`\`
   *The server will start on http://localhost:5000*

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   \`\`\`bash
   cd frontend
   \`\`\`
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the Vite development server:
   \`\`\`bash
   npm run dev
   \`\`\`
   *The app will be available at http://localhost:5173*

## 📝 License
This project is licensed under the MIT License.
