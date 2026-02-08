import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const Join = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      // Redirect to home with the code, user will enter username first
      navigate(`/?code=${code.toUpperCase()}`);
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  return null;
};

export default Join;
