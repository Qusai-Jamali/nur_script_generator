import { useState } from 'react';
import { apiPost } from '../api';
import { useAuth } from '../state/AuthContext';

const CATEGORIES = {
  "Prophet's Teachings ﷺ": 'prophets_teachings',
  'Sahaba Stories': 'sahaba_stories',
  'Islamic History': 'islamic_history',
  'Religious / Quran & Sunnah': 'religious_content',
  'Custom Topic': 'custom',
};

const OUTPUTS = {
  'YouTube Long Script': 'youtube_long',
  'Shorts / Reels Only': 'shorts',
  Both: 'both',
};

const DURATIONS = {
  '1 Min (3 scenes)': '1min',
  '5 Min (6 scenes)': '5min',
  '10 Min (12 scenes)': '10min',
};

export default function GeneratorPage() {
  const { token, user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    topic: '',
    category: 'prophets_teachings',
    audience: 'general',
    tone: 'emotional',
    output_type: 'youtube_long',
    duration: '5min',
    language: 'english',
    notes: '',
  });

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onGenerate = async () => {
    setError('');
    if (!form.topic.trim()) {
      setError('Topic is required.');
      return;
    }
    setLoading(true);
    const result = await apiPost('/generate/', { ...form, topic: form.topic.trim() }, token);
    setLoading(false);
    if (!result.result) {
      setError(result.detail || 'Generation failed.');
      return;
    }
    setResponse(result);
    updateUser({ ...user, credits: result.credits_remaining });
  };

  const data = response?.result || {};

  return (
    <div>
      <h2>New Script</h2>
      <div className="two-col">
        <div className="card">
          <input placeholder="Topic" value={form.topic} onChange={(e) => onChange('topic', e.target.value)} />
          <select onChange={(e) => onChange('category', e.target.value)} value={form.category}>
            {Object.entries(CATEGORIES).map(([label, value]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select onChange={(e) => onChange('audience', e.target.value)} value={form.audience}>
            <option value="general">General</option>
            <option value="youth">Youth</option>
            <option value="scholarly">Scholarly</option>
          </select>
          <select onChange={(e) => onChange('tone', e.target.value)} value={form.tone}>
            <option value="emotional">Emotional</option>
            <option value="poetic">Poetic</option>
            <option value="historical">Historical</option>
            <option value="motivational">Motivational</option>
          </select>
          <select onChange={(e) => onChange('output_type', e.target.value)} value={form.output_type}>
            {Object.entries(OUTPUTS).map(([label, value]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select onChange={(e) => onChange('duration', e.target.value)} value={form.duration}>
            {Object.entries(DURATIONS).map(([label, value]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select onChange={(e) => onChange('language', e.target.value)} value={form.language}>
            <option value="english">English</option>
            <option value="urdu">Urdu</option>
            <option value="arabic">Arabic</option>
          </select>
          <textarea
            rows={4}
            placeholder="Creator notes"
            value={form.notes}
            onChange={(e) => onChange('notes', e.target.value)}
          />
          <button disabled={loading || !form.topic.trim() || (user?.credits ?? 0) < 1} onClick={onGenerate}>
            {loading ? 'Generating...' : '✦ Generate Script'}
          </button>
          {error ? <div className="error">{error}</div> : null}
        </div>

        <div className="card">
          {!response ? <p>Configure and generate to view script output.</p> : null}
          {response ? (
            <>
              <h3>{data.youtube_title || 'Script Ready'}</h3>
              <p><strong>Hook:</strong> {data.hook}</p>
              <p><strong>Crescendo:</strong> {data.emotional_crescendo}</p>
              <p><strong>CTA:</strong> {data.cta}</p>
              <h4>Scenes</h4>
              {(data.scenes || []).map((scene) => (
                <div key={scene.scene_num} className="scene">
                  <strong>Scene {scene.scene_num} ({scene.duration_seconds}s)</strong>
                  <p>{scene.narration}</p>
                </div>
              ))}
              <h4>Shorts Version</h4>
              <p>{data.shorts_version}</p>
              <h4>Description</h4>
              <p>{data.description}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
