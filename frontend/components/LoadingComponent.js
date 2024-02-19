import React from 'react';

export default function LoadingComponent()
{
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const loadingStartFunc = () => {
            setLoading(true);
        };

        const loadingEndFunc = () => {
            setLoading(false);
        };

        window.addEventListener("loadingStart", loadingStartFunc);
        window.addEventListener("loadingEnd", loadingEndFunc);

        return () => {
            window.removeEventListener("loadingStart", loadingStartFunc);
            window.removeEventListener("loadingEnd", loadingEndFunc);
        }
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