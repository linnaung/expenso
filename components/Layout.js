import Link from 'next/link'
import Head from 'next/head'
export default function Layout({children, title='Expenso'}){
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
      </Head>
      <div className="container">
        <header className="row" style={{justifyContent:'space-between',marginBottom:16,alignItems:'flex-start'}}>
          <div>
            <h1 style={{margin:0}}>{title}</h1>
            <p className="muted small" style={{marginTop:6}}>Track your expenses — fast & simple</p>
          </div>
          <nav className="row" style={{alignItems:'center'}}>
            <Link href="/" className="nav-link">List</Link>
            <Link href="/add" className="btn-cta" style={{marginLeft:12,background:'var(--accent)',padding:'8px 12px',borderRadius:10,color:'#021124',textDecoration:'none'}}>Add expense</Link>
          </nav>
        </header>
        <main className="card">{children}</main>
      </div>
    </div>
  )
}
