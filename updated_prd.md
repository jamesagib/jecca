**Product Requirements Document (PRD)**

**Feature:** Voice to Reminders with Recorded Audio Transcription

### Cost Analysis per User

**AssemblyAI Nano API Pricing:**
- **Cost**: $0.00037 per second of audio
- **30-second recording**: $0.011 per transcription
- **Monthly estimate (20 voice reminders)**: $0.22 per user
- **Monthly estimate (50 voice reminders)**: $0.55 per user

**OpenAI GPT-4o-mini (Text Cleaning):**
- **Cost**: ~$0.000015 per 100 tokens
- **Average reminder cleanup**: ~200 tokens ($0.00003 per reminder)
- **Monthly estimate (20 voice reminders)**: $0.0006 per user
- **Monthly estimate (50 voice reminders)**: $0.0015 per user

**Total Monthly AI Costs per User:**
- **Light usage (20 reminders)**: ~$0.22
- **Heavy usage (50 reminders)**: ~$0.55
- **Annual cost per user**: $2.64 - $6.60

**Additional Supabase Costs:**
- **Storage**: ~$0.021 per GB (audio files at 30 seconds ≈ 1MB each)
- **Edge Function calls**: Included in most plans
- **Database operations**: Minimal cost for reminder storage

**Cost Optimization Tips:**
- Implement audio compression to reduce file sizes
- Set monthly limits per user (e.g., 30 voice reminders)
- Consider bulk pricing tiers for high-volume users
- Cache common transcription patterns

---

### Objective

Enable users to record reminders into the app and have them transcribed and appear with smooth animations after recording completion, syncing to the Supabase database.

---

### Goals

* Record audio for reminders with visual feedback
* Transcribe recorded audio using AssemblyAI Nano API
* Animate reminders into the list after successful transcription
* Sync each valid reminder to Supabase
* Optionally clean and structure the reminders with ChatGPT
* Append "(voice)" to each transcribed reminder in the database

---

### Technology Stack

| Feature              | Tool / Library                                                |
| -------------------- | ------------------------------------------------------------- |
| Transcription        | AssemblyAI Nano API via Supabase Edge Function               |
| Voice Recording      | `expo-av` Audio Recording                                     |
| File Upload          | Supabase Storage or direct API upload                        |
| Animations           | `react-native-reanimated`                                     |
| Data Sync            | Supabase (via API endpoints)                                  |
| Text Structuring     | OpenAI (ChatGPT API via Supabase Edge Function)              |

---

### .env Variables (Cursor Instruction)

Make sure to store API keys securely in the `.env` file:

```env
ASSEMBLYAI_API_KEY=your_assemblyai_key_here
OPENAI_API_KEY=your_openai_key_here
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

### UX Flow — Step-by-Step

1. **Microphone Button Setup**

   * Place a circular button at the bottom center of the screen.
   * Label it with a microphone icon.
   * Show recording state with pulsing animation and timer.

2. **Request Microphone Permissions**

```ts
import { Audio } from 'expo-av';

const getPermission = async () => {
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Microphone permission is required.');
    return false;
  }
  return true;
};
```

3. **Start Audio Recording**

```ts
import { Audio } from 'expo-av';

const startRecording = async () => {
  try {
    const permission = await getPermission();
    if (!permission) return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    
    setRecording(recording);
    setIsRecording(true);
  } catch (err) {
    console.error('Failed to start recording', err);
  }
};
```

4. **Stop Recording and Get Audio File**

```ts
const stopRecording = async () => {
  if (!recording) return;

  setIsRecording(false);
  await recording.stopAndUnloadAsync();
  
  const uri = recording.getURI();
  if (uri) {
    setIsProcessing(true);
    await processAudioFile(uri);
  }
  
  setRecording(null);
};
```

5. **Upload and Transcribe Audio**

```ts
const processAudioFile = async (audioUri: string) => {
  try {
    // Create FormData for audio file
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);

    // Send to Supabase Edge Function for transcription
    const response = await fetch('https://<your-project>.supabase.co/functions/v1/transcribe-audio', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
      },
      body: formData,
    });

    const { transcription } = await response.json();
    
    if (transcription) {
      await handleTranscription(transcription);
    }
  } catch (error) {
    console.error('Transcription failed:', error);
    alert('Failed to transcribe audio. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};
```

6. **Transcription Handling**

```ts
const handleTranscription = async (rawText: string) => {
  try {
    // Optional: Clean text with ChatGPT
    const res = await fetch('https://<your-project>.supabase.co/functions/v1/clean-reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ text: rawText })
    });

    const { cleanedText } = await res.json();
    const finalText = cleanedText || rawText;
    const textWithLabel = `${finalText} (voice)`;
    
    // Add to local state first for immediate UI feedback
    addReminderToList(textWithLabel);
    
    // Sync to database
    await syncReminderToDatabase(textWithLabel);
    
  } catch (error) {
    console.error('Error processing transcription:', error);
  }
};
```

7. **UI Animation — Show Reminder in List**

```tsx
import Animated, { FadeInUp } from 'react-native-reanimated';

// Recording state UI
{isRecording && (
  <Animated.View entering={FadeInUp.duration(200)}>
    <View style={styles.recordingIndicator}>
      <Text>Recording... {recordingTime}s</Text>
      <View style={styles.pulsingDot} />
    </View>
  </Animated.View>
)}

// Processing state UI
{isProcessing && (
  <Animated.View entering={FadeInUp.duration(200)}>
    <View style={styles.processingIndicator}>
      <ActivityIndicator />
      <Text>Transcribing...</Text>
    </View>
  </Animated.View>
)}

// New reminder animation
<Animated.View entering={FadeInUp.duration(300)}>
  <ReminderCard text={transcribedText} />
</Animated.View>
```

8. **Sync with Supabase via API**

**API Endpoint:** `POST /reminders/add`

```ts
const syncReminderToDatabase = async (textWithLabel: string) => {
  try {
    await fetch('https://<your-project>.supabase.co/functions/v1/reminders/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        text: textWithLabel,
        datetime: new Date().toISOString(),
        user_id: currentUser.id,
      })
    });
  } catch (error) {
    console.error('Failed to sync reminder:', error);
    // Handle offline/retry logic here
  }
};
```

---

### Supabase Table: `reminders`

| Field       | Type      | Description                   |
| ----------- | --------- | ----------------------------- |
| id          | UUID      | Primary key                   |
| user\_id    | UUID      | Foreign key to users table    |
| text        | Text      | Reminder content              |
| datetime    | Timestamp | Scheduled time or created\_at |
| created\_at | Timestamp | Auto-generated                |

---

### Supabase Edge Function: `transcribe-audio`

* Receives audio file, uploads to AssemblyAI Nano API, and returns transcription.

**Example:**

```ts
import { serve } from 'https://deno.land/std/http/server.ts';

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    
    // Verify user authentication here...

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert to buffer for AssemblyAI
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Upload to AssemblyAI Nano API
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ASSEMBLYAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_data: Array.from(new Uint8Array(audioBuffer)),
        nano: true, // Use Nano model for speed
      }),
    });

    const result = await response.json();
    
    return new Response(JSON.stringify({ 
      transcription: result.text,
      confidence: result.confidence 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Transcription failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

---

### Supabase Edge Function: `clean-reminder`

* Sends transcription to OpenAI to extract structured or polished reminder text.

**Example:**

```ts
serve(async (req) => {
  const { text } = await req.json();

  const chat = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Convert this sentence into a structured and clear reminder. Keep it concise and actionable.' },
        { role: 'user', content: text }
      ]
    })
  });

  const completion = await chat.json();
  const cleanedText = completion.choices[0].message.content;

  return new Response(JSON.stringify({ cleanedText }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

---

### Additional Features & Tips

* **Recording Timer**: Show recording duration during capture
* **Audio Visualization**: Optional waveform display while recording
* **Retry Mechanism**: Allow users to re-record if transcription fails
* **Offline Handling**: Queue reminders locally if network is unavailable
* **Maximum Recording Length**: 30 seconds maximum per recording
* **Auto-scroll**: Animate list to show new reminders
* **Loading States**: Clear visual feedback during processing

---

### Recording States

1. **Idle**: Microphone button ready
2. **Recording**: Pulsing animation, timer, stop button
3. **Processing**: Loading spinner, "Transcribing..." message
4. **Success**: Reminder appears in list with animation
5. **Error**: Error message with retry option

---

### Success Criteria

* Users can record audio reminders up to 30 seconds
* Transcription accuracy is high using AssemblyAI Nano
* Recording state is clearly indicated with visual feedback
* Reminders appear immediately after successful transcription
* Each item is animated into the UI smoothly
* Database updates happen reliably via Supabase functions
* Reminder text is cleaned up with ChatGPT when needed
* "(voice)" is appended to all reminders created from speech
* Error states and retry mechanisms work properly
* Permission prompts and fallback states are handled clearly