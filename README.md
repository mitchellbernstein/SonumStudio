# TTS Studio

A modern web application for generating high-quality audio from text using AI-powered Text-to-Speech models via Replicate's API. Built with Next.js, React, and Tailwind CSS, featuring a clean Notion-like interface.

## Features

- **Script Editor**: Write and edit text scripts with a clean, distraction-free interface
- **Script Organization**: Organize scripts with names, tags, and creation dates
- **Sidebar Navigation**: Easy navigation between scripts with search functionality
- **AI-Powered TTS**: Generate high-quality audio using Replicate's TTS models
- **Audio Management**: Play, download, and regenerate audio files
- **Local Storage**: Scripts are automatically saved locally in your browser
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling**: Comprehensive error handling for API calls and edge cases

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Replicate account and API token (get one at [replicate.com](https://replicate.com))

### Installation

1. Clone or download this repository:
```bash
git clone <repository-url>
cd tts-studio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your Replicate API token:
```bash
REPLICATE_API_TOKEN=your_replicate_api_token_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Getting Your Replicate API Token

1. Sign up at [replicate.com](https://replicate.com)
2. Go to your account settings
3. Navigate to the API tokens section
4. Create a new token and copy it
5. Add it to your `.env.local` file

## Usage

### Creating Scripts

1. Click the "New Script" button in the sidebar
2. Give your script a name by clicking on "Untitled Script"
3. Start writing your text content
4. Add tags to organize your scripts (optional)

### Generating Audio

1. Write or paste your text content in the editor
2. Click "Generate Audio" to create an MP3 file
3. Use "Regenerate" to create a new version with different characteristics
4. Play the audio directly in the browser or download it

### Managing Scripts

- **Search**: Use the search bar to find scripts by name, content, or tags
- **Tags**: Add tags to categorize your scripts
- **Delete**: Use the trash icon to delete scripts (with confirmation)
- **Auto-save**: Changes are automatically saved to browser storage

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **TTS API**: Replicate (Bark model by Suno AI)
- **Storage**: Browser localStorage
- **ID Generation**: UUID

## Project Structure

```
tts-studio/
├── app/
│   ├── api/
│   │   └── generate-audio/
│   │       └── route.ts          # API route for TTS generation
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main application page
├── components/
│   ├── Sidebar.tsx               # Script navigation sidebar
│   └── ScriptEditor.tsx          # Main editor component
├── types/
│   └── index.ts                  # TypeScript type definitions
├── utils/
│   └── storage.ts                # localStorage utilities
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## API Integration

The app uses Replicate's Bark TTS model by default. The model ID can be changed in `app/api/generate-audio/route.ts`:

```typescript
const output = await replicate.run(
  "suno-ai/bark:b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787",
  {
    input: {
      text: text.trim(),
      text_temp: 0.7,
      waveform_temp: 0.7,
    }
  }
);
```

## Customization

### Changing TTS Models

To use a different TTS model from Replicate:

1. Browse available models at [replicate.com/explore](https://replicate.com/explore)
2. Update the model ID in `app/api/generate-audio/route.ts`
3. Adjust the input parameters as needed for the new model

### Styling

The app uses Tailwind CSS with a custom color scheme. Modify `tailwind.config.js` to change the appearance:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "hsl(221.2 83.2% 53.3%)",
        foreground: "hsl(210 40% 98%)",
      },
      // ... other colors
    },
  },
},
```

## Deployment

### Vercel (Recommended)

1. Push your code to a GitHub repository
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your `REPLICATE_API_TOKEN` environment variable in Vercel's dashboard
4. Deploy!

### Other Platforms

This Next.js app can be deployed on any platform that supports Node.js:
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

Make sure to set the `REPLICATE_API_TOKEN` environment variable on your deployment platform.

## Troubleshooting

### Common Issues

1. **"Replicate API token not configured" error**
   - Make sure you've created a `.env.local` file with your API token
   - Restart the development server after adding environment variables

2. **Audio generation fails**
   - Check that your Replicate account has sufficient credits
   - Verify your API token is valid and active
   - Check the browser console for detailed error messages

3. **Scripts not saving**
   - Ensure your browser allows localStorage
   - Try clearing browser storage and reloading the app

### Performance Tips

- Keep script content reasonable in length (very long texts may take longer to process)
- The app stores scripts locally, so clearing browser data will remove them
- Consider backing up important scripts externally

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information about your problem

---

Built with ❤️ using Next.js and Replicate AI 