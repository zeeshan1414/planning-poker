import { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import Room from './pages/Room.jsx';
import { ROOM_ID_RE } from './lib/storage.js';

function parse(pathname) {
  const m = pathname.match(/^\/room\/([^/]+)\/?$/);
  return m && ROOM_ID_RE.test(m[1]) ? { page: 'room', roomId: m[1] } : { page: 'home' };
}

export default function App() {
  const [route, setRoute] = useState(() => parse(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(parse(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (path) => {
    window.history.pushState(null, '', path);
    setRoute(parse(path));
  };

  return route.page === 'room' ? (
    <Room key={route.roomId} roomId={route.roomId} navigate={navigate} />
  ) : (
    <Home navigate={navigate} />
  );
}
