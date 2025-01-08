# Brenda's Loose Thoughts (BVR_LT)

## Overview
A digital preservation project to convert Brenda's handwritten notes and thoughts into a searchable, organized digital format using GPT-4 for text extraction and ElevenLabs for text-to-speech.

## Tech Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Database**: Supabase (PostgreSQL)
- **AI Processing**: OpenAI GPT-4 (specifically gpt-4o-mini model)
- **Text-to-Speech**: ElevenLabs API (multilingual v2 model)
- **Markdown Rendering**: Marked.js (via CDN)
- **Development Server**: Node.js with environment variable injection
- **Version Control**: Git
- **Deployment**: Vercel

## Project Structure
```
brenda-thoughts/
├── .env                    # Environment variables (not in repo)
├── .env.example           # Example environment variables
├── .gitignore             # Git ignore configuration
├── index.html             # Main HTML file with environment injection
├── style.css              # CSS with CSS variables and responsive design
├── app.js                 # Main application logic
├── server.js              # Development server for env injection
├── package.json           # Project dependencies
└── services/              # External services
    ├── supabase.js        # Database operations
    ├── openai.js          # GPT-4 integration
    └── elevenlabs.js      # Text-to-speech functionality
```

## Database Schema
```sql
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS with open access
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON notes FOR ALL USING (true);
```

## Implementation Details

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
MODEL_NAME=gpt-4o-mini

# Supabase Configuration
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=[ANON_KEY]

# ElevenLabs Configuration
ELEVENLABS_API_KEY=[API_KEY]
```

### Frontend Structure
- **HTML**: Single page with environment variable injection
- **CSS**: CSS variables for theming and responsive design
- **JavaScript**: Modular structure with service separation

### GPT-4 Integration
- Model: gpt-4o-mini
- Prompt includes specific instructions for:
  - Correcting obvious misspellings
  - Maintaining original capitalization
  - Using Markdown for formatting:
    - **bold** for emphasized text
    - _italic_ for underlined text
    - Headers for titles
    - Lists and quotes as needed
  - Returns structured JSON with:
    - content: Markdown formatted text
    - type: prayer/quote/lesson
    - year: extracted year or null

### ElevenLabs Integration
- Model: eleven_multilingual_v2
- Voice ID: mM1PRloZ2t81CV01YcC2 (custom voice)
- Features:
  - Text-to-speech conversion
  - Automatic markdown stripping
  - Voice settings:
    - Stability: 0.75
    - Similarity boost: 0.75
  - Error handling and status feedback
  - Audio resource cleanup

### Supabase Integration
- Using REST API with anon key
- Endpoints:
  - POST /rest/v1/notes - Create new note
  - GET /rest/v1/notes?select=* - Fetch all notes
- Notes are ordered by created_at DESC
- Error handling includes detailed logging

### Frontend Features
- Drag & drop or click-to-upload images
- Multiple image upload support
- Real-time processing status
- Markdown rendering of notes
- Responsive grid layout
- Type and year metadata display
- Text-to-speech playback
- Note deletion with confirmation

## Development Setup

### Local Development
1. Clone repository
2. Copy .env.example to .env and fill in values
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development server:
   ```bash
   npm start
   ```
5. Access at http://localhost:3001

### Environment Files
- **.env**: (not in repo)
  ```
  OPENAI_API_KEY=sk-...
  MODEL_NAME=gpt-4o-mini
  SUPABASE_URL=https://[PROJECT_ID].supabase.co
  SUPABASE_ANON_KEY=[ANON_KEY]
  ELEVENLABS_API_KEY=[API_KEY]
  ```
- **.env.example**:
  ```
  OPENAI_API_KEY=your_openai_api_key_here
  MODEL_NAME=gpt-4o-mini
  SUPABASE_URL=your_supabase_project_url_here
  SUPABASE_ANON_KEY=your_supabase_anon_key_here
  ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
  ```

### Git Configuration
- **.gitignore**:
  ```
  # Environment variables
  .env
  .env.local
  .env.*.local

  # Dependencies
  node_modules/
  npm-debug.log*
  yarn-debug.log*
  yarn-error.log*

  # IDE/Editor
  .vscode/
  .idea/
  *.swp
  *.swo
  .DS_Store

  # Build/Deploy
  dist/
  build/
  .vercel
  ```

## Deployment Process
1. Initialize Git repository
2. Create GitHub repository
3. Push code to GitHub
4. Set up Vercel project
5. Configure environment variables in Vercel
6. Deploy via Vercel CLI

## Troubleshooting Notes

### Common Issues & Solutions
1. **Environment Variables**
   - Issue: Variables not accessible in browser
   - Solution: Use server.js for injection into window.env

2. **Supabase Connection**
   - Issue: 401 Unauthorized errors
   - Solution: Ensure proper header format with anon key
   - Required Headers:
     ```javascript
     headers: {
         'apikey': SUPABASE_KEY,
         'Authorization': `Bearer ${SUPABASE_KEY}`,
         'Content-Type': 'application/json'
     }
     ```

3. **GPT-4 Response Handling**
   - Issue: Inconsistent text formatting
   - Solution: Enhanced prompt with specific Markdown instructions
   - Added cleanup for JSON parsing

## Future Considerations
1. Word document export functionality
2. Search and filter capabilities
3. Categories/tags organization
4. Batch processing optimization
5. Image preprocessing for better OCR
6. Backup and restore functionality

## Maintenance
- Regular backups of Supabase database
- Monitor OpenAI API usage
- Monitor ElevenLabs API usage and credits
- Check for security updates
- Review error logs for issues 