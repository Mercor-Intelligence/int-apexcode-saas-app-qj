import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { Eye, MousePointer, TrendingUp, Globe, Smartphone, Monitor, BarChart3 } from 'lucide-react'
import './AnalyticsTab.css'

export default function AnalyticsTab() {
  const [period, setPeriod] = useState('7d')
  const [analytics, setAnalytics] = useState(null)
  const [linkStats, setLinkStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [summary, links] = await Promise.all([
        api.get(`/analytics/summary?period=${period}`),
        api.get('/analytics/links'),
      ])
      setAnalytics(summary)
      setLinkStats(links)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="analytics-tab">
        <div className="tab-header">
          <h2>Analytics</h2>
        </div>
        <div className="analytics-loading">
          <div className="loader"></div>
        </div>
      </div>
    )
  }

  const maxViews = Math.max(...(analytics?.dailyViews?.map(d => d.views) || [1]), 1)

  return (
    <div className="analytics-tab">
      <div className="tab-header">
        <div>
          <h2>Analytics</h2>
          <p>Track your profile performance</p>
        </div>
        <div className="period-selector">
          {['24h', '7d', '30d', 'all'].map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === 'all' ? 'All time' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon views">
            <Eye size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{analytics?.totalViews || 0}</span>
            <span className="stat-label">Views</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon clicks">
            <MousePointer size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{analytics?.totalClicks || 0}</span>
            <span className="stat-label">Clicks</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon ctr">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{analytics?.ctr || 0}%</span>
            <span className="stat-label">CTR</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      {analytics?.dailyViews?.length > 0 && (
        <div className="analytics-section">
          <h3>Views over time</h3>
          <div className="chart-container">
            <div className="bar-chart">
              {analytics.dailyViews.map((day, i) => (
                <div key={i} className="bar-wrapper">
                  <div 
                    className="bar" 
                    style={{ height: `${(day.views / maxViews) * 100}%` }}
                    title={`${day.date}: ${day.views} views`}
                  >
                    <span className="bar-value">{day.views}</span>
                  </div>
                  <span className="bar-label">{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="analytics-row">
        {/* Top Links */}
        <div className="analytics-section">
          <h3>Top Links</h3>
          {linkStats.length === 0 ? (
            <div className="empty-section">
              <BarChart3 size={32} />
              <p>No link clicks yet</p>
            </div>
          ) : (
            <div className="top-links">
              {linkStats.slice(0, 5).map((link, i) => (
                <div key={link.id} className="top-link-item">
                  <span className="rank">{i + 1}</span>
                  <div className="link-info">
                    <span className="link-title">{link.title}</span>
                    <span className="link-url">{link.url}</span>
                  </div>
                  <span className="link-clicks">{link.clickCount} clicks</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="analytics-section">
          <h3>Top Referrers</h3>
          {!analytics?.topReferrers?.length ? (
            <div className="empty-section">
              <Globe size={32} />
              <p>No referrer data yet</p>
            </div>
          ) : (
            <div className="referrers-list">
              {analytics.topReferrers.map((ref, i) => (
                <div key={i} className="referrer-item">
                  <Globe size={16} />
                  <span className="referrer-name">{ref.name}</span>
                  <span className="referrer-count">{ref.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Devices */}
      <div className="analytics-section">
        <h3>Devices</h3>
        <div className="devices-grid">
          <div className="device-card">
            <Smartphone size={24} />
            <span className="device-value">{analytics?.devices?.mobile || 0}</span>
            <span className="device-label">Mobile</span>
          </div>
          <div className="device-card">
            <Monitor size={24} />
            <span className="device-value">{analytics?.devices?.desktop || 0}</span>
            <span className="device-label">Desktop</span>
          </div>
        </div>
      </div>
    </div>
  )
}

