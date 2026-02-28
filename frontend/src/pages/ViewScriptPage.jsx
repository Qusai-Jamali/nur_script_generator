import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet } from '../api';
import { useAuth } from '../state/AuthContext';

export default function ViewScriptPage() {
  const { scriptId } = useParams();
  const { token } = useAuth();
  const [script, setScript] = useState(null);

  useEffect(() => {
    apiGet(`/generate/${scriptId}`, token).then((data) => setScript(data));
  }, [scriptId]);

  if (!script || script.detail) {
    return <div>{script?.detail || 'Loading...'}</div>;
  }

  const result = script.result_json || {};

  return (
    <div>
      <h2>{result.youtube_title || script.topic || 'Script'}</h2>
      <div className="card">
        <h3>Hook</h3>
        <p>{result.hook || ''}</p>
      </div>
      <div className="card">
        <h3>Scenes</h3>
        {(result.scenes || []).map((scene) => (
          <div key={scene.scene_num} className="scene">
            <strong>Scene {scene.scene_num}</strong>
            <p>{scene.narration}</p>
            <small>{scene.visual_suggestion}</small>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Shorts Version</h3>
        <p>{result.shorts_version || ''}</p>
      </div>
    </div>
  );
}
