export default function LoadingDashboard() {
  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="dash-header" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
           <div style={{ width: '300px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', marginBottom: '10px' }} className="skeleton-pulse"></div>
           <div style={{ width: '400px', height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} className="skeleton-pulse"></div>
        </div>
      </div>
      
      <div className="dash-kpi-grid" style={{ marginBottom: '2rem' }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="dash-kpi-col">
            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', border: '1px solid #e2e8f0', height: '110px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <div>
                    <div className="skeleton-pulse" style={{ width: '100px', height: '15px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '20px' }}></div>
                    <div className="skeleton-pulse" style={{ width: '50px', height: '35px', background: '#e2e8f0', borderRadius: '8px' }}></div>
                 </div>
                 <div className="skeleton-pulse" style={{ width: '60px', height: '60px', background: '#f8fafc', borderRadius: '16px' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-bottom-grid">
         <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'white', borderRadius: '24px', padding: '30px', height: '350px', border: '1px solid #e2e8f0' }} className="skeleton-pulse"></div>
            <div style={{ background: 'white', borderRadius: '24px', padding: '30px', height: '400px', border: '1px solid #e2e8f0' }} className="skeleton-pulse"></div>
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'white', borderRadius: '24px', padding: '30px', height: '300px', border: '1px solid #e2e8f0' }} className="skeleton-pulse"></div>
            <div style={{ background: 'white', borderRadius: '24px', padding: '30px', height: '300px', border: '1px solid #e2e8f0' }} className="skeleton-pulse"></div>
         </div>
      </div>
    </div>
  );
}
