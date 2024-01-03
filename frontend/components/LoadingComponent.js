import React from 'react';

export default function LoadingComponent()
{
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        window.addEventListener("loadingStart", () => {
            setLoading(true);
        });
        window.addEventListener("loadingEnd", () => {
            setLoading(false);
        });
    }, []);

    return loading && <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
      }}>
    <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          fontSize: '50px',
          fontWeight: 'bold',
          color: '#000',
        }}
    >
        <p className="animated fadeIn">Loading...</p>
    </div>
  </div>
}