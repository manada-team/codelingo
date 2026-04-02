import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="retro-header">
        <h1>Codelingo</h1>
        <nav>
          <ul>
            <li>Inicio</li>
            <li>Juego</li>
            <li>Contacto</li>
          </ul>
        </nav>
      </header>
      <main className="retro-main">
        <section>
          <h2>Bienvenido a CODELINGO</h2>
          <p>Resuelve desafíos con programación.</p>
          <button>Comenzar</button>
        </section>
      </main>
      <footer className="retro-footer">
        <p>© 2026 Codelingo</p>
      </footer>
    </div>
  );
}

export default App;
