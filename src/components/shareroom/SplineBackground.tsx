import { Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

export const SplineBackground = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Suspense
        fallback={
          <div
            className="absolute inset-0 z-0"
            style={{
              background: `
                radial-gradient(
                  circle at top,
                  rgba(255, 255, 255, 0.08) 0%,
                  rgba(255, 255, 255, 0.08) 20%,
                  rgba(0, 0, 0, 0.0) 60%
                )
              `,
            }}
          />
        }
      >
        <Spline
          scene="https://prod.spline.design/g56M0W6eC3Z2-a6m/scene.splinecode"
          className="absolute inset-0 w-full h-full"
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
      </Suspense>
    </div>
  );
};