import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { BlochSphere } from '@/components/quantum/BlochSphere'
import { Brand } from '@/components/ui/Logo'
import { buttonClass } from '@/components/ui/Button'
import { useAuth } from '@/store/auth'

const LOOP = ['Qubit', 'Gate', 'Circuit', 'Simulation', 'Visualization', 'Understanding']
const STEPS = [
  ['Learn', 'Short, visual lessons with just enough math.'],
  ['Build', 'Drag gates onto wires in a real circuit editor.'],
  ['Simulate', 'Run the circuit on a real quantum simulator.'],
  ['Visualize', 'See probabilities, amplitudes, and the Bloch sphere.'],
  ['Ask', 'Question an AI tutor that sees your actual results.'],
  ['Practice', 'Challenges and quizzes, scored on the server.'],
]

function LoopDiagram() {
  return (
    <ol className="loop" aria-label="From qubit to understanding">
      {LOOP.map((l, i) => (
        <motion.li key={l} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.3 }}>
          <span className="loop__node">{l}</span>
          {i < LOOP.length - 1 && <span className="loop__arrow" aria-hidden="true">→</span>}
        </motion.li>
      ))}
    </ol>
  )
}

function IdealBellCircuit() {
  return (
    <svg viewBox="0 0 320 130" className="landing-circuit" role="img" aria-label="Circuit: Hadamard on qubit 0, then CNOT from qubit 0 to qubit 1">
      <line className="wire" x1="40" x2="300" y1="35" y2="35" />
      <line className="wire" x1="40" x2="300" y1="95" y2="95" />
      <text className="wire__label" x="8" y="39">q0</text>
      <text className="wire__label" x="8" y="99">q1</text>
      <g className="gate gate--std"><rect className="gate__box" x="80" y="15" width="40" height="40" rx="10" /><text className="gate__text" x="100" y="40" textAnchor="middle">H</text></g>
      <g className="gate">
        <line className="gate__link" x1="200" x2="200" y1="35" y2="95" />
        <circle className="gate__dot" cx="200" cy="35" r="5" />
        <circle className="gate__target" cx="200" cy="95" r="13" />
        <line className="gate__plus" x1="187" x2="213" y1="95" y2="95" /><line className="gate__plus" x1="200" x2="200" y1="82" y2="108" />
      </g>
    </svg>
  )
}

export default function Landing() {
  const authed = useAuth((s) => s.status === 'authenticated')
  return (
    <div className="landing">
      <header className="landing__nav">
        <Brand />
        <nav className="row">
          {authed ? <Link to="/dashboard" className={buttonClass('primary', 'sm')}>Open app</Link> : (
            <><Link to="/login" className={buttonClass('ghost', 'sm')}>Sign in</Link><Link to="/register" className={buttonClass('primary', 'sm')}>Get started</Link></>
          )}
        </nav>
      </header>

      <section className="hero">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="eyebrow">QuantumLearn AI</p>
          <h1 className="hero__title">Understand quantum computing<br />by building it.</h1>
          <p className="lead muted">Learn concepts. Build circuits. Run simulations. See what quantum systems actually do.</p>
          <div className="row row--center">
            <Link to={authed ? '/dashboard' : '/register'} className={buttonClass('primary', 'lg')}>Start Learning <ArrowRight size={18} /></Link>
            <Link to="/quantum-lab" className={buttonClass('secondary', 'lg')}>Explore Quantum Lab</Link>
          </div>
        </motion.div>
        <LoopDiagram />
      </section>

      <section className="landing__section">
        <h2>One loop, from idea to intuition</h2>
        <div className="grid grid--3">
          {STEPS.map(([t, d], i) => (
            <motion.div key={t} className="card step" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <span className="step__n">{i + 1}</span><h3>{t}</h3><p className="muted">{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="landing__section split">
        <div>
          <h2>A circuit editor that gets out of the way</h2>
          <p className="muted">Place gates with a click or the keyboard, edit angles in π, undo anything, and run it. Results come from the backend simulator, never from the browser.</p>
        </div>
        <div className="card"><IdealBellCircuit /><p className="muted caption">Illustration: the ideal Bell-state circuit.</p></div>
      </section>

      <section className="landing__section split split--rev">
        <div className="card tutor-preview glass">
          <div className="bubble bubble--user"><p>Why are these measurements correlated?</p></div>
          <div className="bubble bubble--assistant"><p>After H and CNOT, both qubits share one state, (|00⟩ + |11⟩)/√2. Measuring one fixes the other, so you only ever see 00 or 11.</p></div>
          <p className="muted caption">Example conversation. In the app, the tutor sees your circuit and results.</p>
        </div>
        <div>
          <h2>An AI tutor that sees what you built</h2>
          <p className="muted">Ask for a hint, a simpler analogy, or a debug session. The tutor explains your real simulation output and never makes up numbers.</p>
        </div>
      </section>

      <section className="landing__section">
        <h2>See what actually happened</h2>
        <div className="grid grid--3">
          <div className="card stack">
            <h3>Probabilities</h3>
            <div className="mini-bars" role="img" aria-label="Ideal Bell state: 50% for 00 and 50% for 11"><span style={{ height: '50%' }} /><span style={{ height: 0 }} /><span style={{ height: 0 }} /><span style={{ height: '50%' }} /></div>
            <p className="muted caption">Ideal Bell state: |00⟩ and |11⟩ at 50% each.</p>
          </div>
          <div className="card stack">
            <h3>State</h3>
            <p className="mono">|ψ⟩ = (|00⟩ + |11⟩)/√2</p>
            <p className="muted caption">Inspect amplitudes, phase, and probability for every basis state.</p>
          </div>
          <div className="card stack">
            <h3>Bloch sphere</h3>
            <BlochSphere vectors={[{ qubit: 0, x: 0, y: 0, z: 0 }]} />
          </div>
        </div>
      </section>

      <section className="landing__section">
        <h2>Learning that adds up</h2>
        <div className="grid grid--4">
          {['Lessons', 'Challenges', 'Quizzes', 'Progress'].map((t) => <div key={t} className="card"><h3>{t}</h3></div>)}
        </div>
      </section>

      <section className="cta">
        <h2>Start exploring quantum computing.</h2>
        <Link to={authed ? '/dashboard' : '/register'} className={buttonClass('primary', 'lg')}>Create a free account</Link>
      </section>
      <footer className="landing__foot muted">QuantumLearn AI · SIH26140</footer>
    </div>
  )
}
