import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { NFTStorage } from 'nft.storage'
import { useWriteContract } from 'wagmi'

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'address[]', name: 'recipients', type: 'address[]' },
      { internalType: 'string[]', name: 'uris', type: 'string[]' },
    ],
    name: 'batchMint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

function App() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [theme, setTheme] = useState('')
  const [addressesInput, setAddressesInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [minted, setMinted] = useState<Array<{ address: string; tokenId: number; uri: string }>>([])
  const { writeContractAsync } = useWriteContract()
  const [hasPermission, setHasPermission] = useState(false)
  const [_permissionContext, setPermissionContext] = useState<string | null>(null)

 /* const grantPermission = async () => {
    try {
      const result = await (window as any).ethereum?.request({
        method: 'wallet_grantPermissions',
        params: [{
          permissions: [{
            type: 'native-token-transfer',
            data: { allowance: '1000000000000000000' }
          }],
          expiry: Math.floor(Date.now() / 1000) + 3600
        }]
      })
      
      if (result?.permissions) {
        setHasPermission(true)
        setPermissionContext(JSON.stringify(result.permissions)) // store for later delegation
        console.log('Permission granted:', result.permissions)
        alert('Permission granted! You can now mint without signing each transaction.')
      }
    } catch (error) {
      console.error('Permission error:', error)
      alert('Permission request failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  } */

  const generateAndMint = async () => {
    if (!theme.trim() || !addressesInput.trim()) {
      alert('Enter theme and addresses')
      return
    }

    const addresses = addressesInput
      .split('\n')
      .map(a => a.trim())
      .filter(a => a.length > 0)

    if (addresses.length === 0) {
      alert('Enter at least one address')
      return
    }

    setLoading(true)
    try {
      const nftStorage = new NFTStorage({ token: import.meta.env.VITE_NFT_STORAGE_KEY || '' })
      const uris: string[] = []

      for (let i = 0; i < addresses.length; i++) {
        console.log(`Generating image ${i + 1}/${addresses.length}...`)
        
        const res = await fetch('https://api.venice.ai/api/v1/image/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_VENICE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'flux-2-max',
            prompt: `${theme}, recipient ${addresses[i]}, unique variation ${i}`,
            width: 512,
            height: 512,
          }),
        })

        if (!res.ok) {
          console.warn(`Venice failed for ${addresses[i]}, using mock`)
          uris.push('ipfs://QmMockImageCID' + i)
          continue
        }

        const data = await res.json() as { images?: Array<{ data: string }> }
        
        if (!data.images || !data.images[0]) {
          uris.push('ipfs://QmMockImageCID' + i)
          continue
        }

        const base64 = data.images[0].data
        const blob = await fetch(`data:image/png;base64,${base64}`).then(r => r.blob())
        const imageCID = await nftStorage.storeBlob(blob)

        const metadata = {
          name: `${theme} #${i + 1}`,
          description: `AI-generated ${theme} for ${addresses[i]}`,
          image: `ipfs://${imageCID}`,
        }

        const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
        const metadataCID = await nftStorage.storeBlob(metadataBlob)
        uris.push(`ipfs://${metadataCID}`)
      }

      console.log('Calling batchMint with', addresses.length, 'addresses')
      await writeContractAsync({
        address: import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'batchMint',
        args: [addresses as `0x${string}`[], uris],
      })

      const newMints = addresses.map((addr, i) => ({
        address: addr,
        tokenId: i + 1,
        uri: uris[i],
      }))
      setMinted(newMints)
      alert(`Successfully minted ${addresses.length} NFTs`)
    } catch (error) {
      console.error(error)
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <style>{globalStyles}</style>
      
      <div style={styles.header}>
        <h1 style={styles.title}>AgentDrop</h1>
        <p style={styles.subtitle}>AI art minting agent</p>
      </div>

      {isConnected ? (
        <div style={styles.content}>
         <div style={styles.walletSection}>
  <div style={styles.walletInfo}>
    <span style={styles.label}>Connected wallet</span>
    <code style={styles.address}>{address}</code>
  </div>
  <button onClick={() => disconnect()} style={styles.buttonSecondary}>
    Disconnect
  </button>
</div>

          <div style={styles.formSection}>
            <div style={styles.formGroup}>
              <label style={styles.fieldLabel}>Theme</label>
              <input
                type="text"
                placeholder="Afrofuturist warriors"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.fieldLabel}>Recipient addresses</label>
              <textarea
                placeholder="0x123...&#10;0x456..."
                value={addressesInput}
                onChange={(e) => setAddressesInput(e.target.value)}
                style={styles.textarea}
              />
              <span style={styles.hint}>{addressesInput.split('\n').filter(a => a.trim()).length} addresses</span>
            </div>

            <button
              onClick={generateAndMint}
              disabled={loading}
              style={{
                ...styles.buttonPrimary,
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Generating...' : 'Generate and mint'}
            </button>
          </div>

          {minted.length > 0 && (
            <div style={styles.resultsSection}>
              <h2 style={styles.resultsTitle}>Minted NFTs</h2>
              <div style={styles.gallery}>
                {minted.map((nft, i) => (
                  <div key={i} style={styles.card}>
                    <div style={styles.cardMeta}>
                      <span style={styles.tokenId}>Token #{nft.tokenId}</span>
                    </div>
                    <div style={styles.cardContent}>
                      <p style={styles.cardLabel}>Address</p>
                      <code style={styles.cardValue}>{nft.address}</code>
                    </div>
                    <div style={styles.cardContent}>
                      <p style={styles.cardLabel}>Metadata URI</p>
                      <code style={styles.cardValue}>{nft.uri.slice(0, 40)}...</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.connectSection}>
          <p style={styles.connectText}>Connect MetaMask Flask to begin</p>
          <button onClick={() => connect({ connector: injected() })} style={styles.buttonPrimary}>
            Connect wallet
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fafafa',
    padding: '24px',
  },
  header: {
    maxWidth: '800px',
    margin: '0 auto 48px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e5e5e5',
  },
  title: {
    fontSize: '28px',
    fontWeight: '500',
    margin: '0 0 8px',
    color: '#000',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  walletSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    padding: '16px',
    backgroundColor: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
  },
  walletInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  label: {
    fontSize: '12px',
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  address: {
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#000',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: '32px',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    marginBottom: '32px',
  },
  formGroup: {
    marginBottom: '24px',
  },
  fieldLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#000',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d5d5d5',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '13px',
    fontFamily: 'monospace',
    border: '1px solid #d5d5d5',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    minHeight: '100px',
    resize: 'vertical' as const,
  },
  hint: {
    display: 'block',
    marginTop: '6px',
    fontSize: '12px',
    color: '#999',
  },
  buttonPrimary: {
    width: '100%',
    padding: '11px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#fff',
    backgroundColor: '#000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    padding: '8px 16px',
    fontSize: '13px',
    color: '#000',
    backgroundColor: '#f5f5f5',
    border: '1px solid #d5d5d5',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  resultsSection: {
    marginBottom: '32px',
  },
  resultsTitle: {
    fontSize: '16px',
    fontWeight: '500',
    margin: '0 0 16px',
    color: '#000',
  },
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  card: {
    padding: '16px',
    backgroundColor: '#fff',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
  },
  cardMeta: {
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  tokenId: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#000',
  },
  cardContent: {
    marginBottom: '12px',
  },
  cardLabel: {
    fontSize: '11px',
    color: '#999',
    margin: '0 0 4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  cardValue: {
    display: 'block',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#666',
    wordBreak: 'break-all' as const,
    padding: '6px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
  },
  connectSection: {
    maxWidth: '400px',
    margin: '0 auto',
    textAlign: 'center' as const,
    paddingTop: '60px',
  },
  connectText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '24px',
  },
}

const globalStyles = `
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #000;
  }

  button:hover:not(:disabled) {
    background-color: #1a1a1a !important;
  }
`

export default App