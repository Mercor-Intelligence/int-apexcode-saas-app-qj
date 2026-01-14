import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Eye, MousePointer, TrendingUp, Globe, Smartphone, Monitor, Loader2 } from 'lucide-react';
import './AnalyticsTab.css';

export default function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [summary, setSummary] = useState(null);
  const [linkStats, setLinkStats] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [summaryRes, linksRes] = await Promise.all([
        api.get(`/analytics/summary?period=${period}`),
        api.get(`/analytics/links?period=${period}`)
      ]);
      
      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }
      if (linksRes.ok) {
        setLinkStats(await linksRes.json());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-tab loading">
        <Loader2 size={32} className="spin" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-tab">
      <div className="tab-header">
        <div>
          <h2>Analytics</h2>
          <p>Track your profile performance</p>
        </div>
        
        <select 
          value={period} 
          onChange={e => setPeriod(e.target.value)}
          className="period-select"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon views">
            <Eye size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{summary?.totalViews || 0}</span>
            <span className="stat-label">Page Views</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon clicks">
            <MousePointer size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{summary?.totalClicks || 0}</span>
            <span className="stat-label">Link Clicks</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon ctr">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{summary?.ctr || 0}%</span>
            <span className="stat-label">Click Rate</span>
          </div>
        </div>
      </div>

      {/* Top referrers */}
      <section className="analytics-section">
        <h3>Top Referrers</h3>
        {summary?.topReferrers?.length > 0 ? (
          <div className="referrer-list">
            {summary.topReferrers.map((ref, i) => (
              <div key={i} className="referrer-item">
                <Globe size={16} />
                <span className="referrer-name">{ref.source || 'Direct'}</span>
                <span className="referrer-count">{ref.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No referrer data yet</p>
        )}
      </section>

      {/* Devices */}
      <section className="analytics-section">
        <h3>Devices</h3>
        {summary?.devices && Object.keys(summary.devices).length > 0 ? (
          <div className="device-list">
            {Object.entries(summary.devices).map(([device, count]) => (
              <div key={device} className="device-item">
                {device === 'mobile' ? <Smartphone size={16} /> : <Monitor size={16} />}
                <span className="device-name">{device}</span>
                <span className="device-count">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No device data yet</p>
        )}
      </section>

      {/* Link performance */}
      <section className="analytics-section">
        <h3>Link Performance</h3>
        {linkStats.length > 0 ? (
          <div className="link-stats-list">
            {linkStats.map(link => (
              <div key={link.id} className="link-stat-item">
                <div className="link-stat-info">
                  <span className="link-stat-title">{link.title}</span>
                  <span className="link-stat-url">{link.url}</span>
                </div>
                <div className="link-stat-clicks">
                  <MousePointer size={14} />
                  <span>{link.periodClicks} clicks</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No link data yet</p>
        )}
      </section>
    </div>
  );
}

