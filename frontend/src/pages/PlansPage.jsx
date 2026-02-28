import { useEffect, useState } from 'react';
import { apiGet } from '../api';

export default function PlansPage() {
  const [plans, setPlans] = useState({});

  useEffect(() => {
    apiGet('/credits/plans').then((data) => setPlans(data.plans || {}));
  }, []);

  const order = ['basic', 'standard', 'pro'];

  return (
    <div>
      <h2>Plans & Credits</h2>
      <div className="plan-grid">
        {order.map((key) => {
          const item = plans[key] || {};
          return (
            <div key={key} className={`plan-card ${item.popular ? 'popular' : ''}`}>
              <h3>{item.name || key}</h3>
              <p>{item.credits || 0} credits</p>
              <small>{item.note || ''}</small>
            </div>
          );
        })}
      </div>
      <div className="card">
        Payment integration is not implemented yet. Credits are added manually by admin via the admin panel.
      </div>
    </div>
  );
}
