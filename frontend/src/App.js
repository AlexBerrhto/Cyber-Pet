import React, { useState, useEffect,useRef} from 'react';

function App() {
  // 1. STATE: This is where React remembers Rocky's stats
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [formData, setFormData] = useState({ userName: '', phone: '', petName: '' });
  const [pet, setPet] = useState({ hunger: 0, is_sleep: false, name: "Loading..." });
  const [currentAction, setCurrentAction] = useState(null);
  const actionTimer = useRef(null);
  const [view, setView] = useState('login'); // 'login' or 'signup'
  const [error, setError] = useState('');

  // 2. THE FETCH FUNCTION: This "pings" your Python backend

  useEffect(() => {
    // Only start the interval if logged in AND we have a phone number
    if (isLoggedIn && formData.phone) { 
      const interval = setInterval(async () => {
        if (currentAction !== null) return; 
  
        try {
          const res = await fetch(`http://127.0.0.1:8000/status?phone=${formData.phone}`);
          const data = await res.json();
          setPet(data);
        } catch (e) {
          console.error("Heartbeat failed", e);
        }
      }, 10000);
  
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, currentAction, formData.phone]);

  // const updateStatus = async () => {
  //   if (!formData.phone) return; // Don't fetch if we don't have a phone
  //   try {
  //     // FIX: You must include the phone number here just like in the useEffect!
  //     const response = await fetch("http://127.0.0.1:8000/status?phone=" + formData.phone);
  //     const data = await response.json();
  //     setPet(data);
  //   } catch (error) {
  //     console.error("Status update failed:", error);
  //   }
  // };

  const handleCheckUser = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/status?phone=${formData.phone}`);
      const data = await res.json();
  
      if (data.name === "Unknown") {
        setError("Number does not exist. Please sign up!");
      } else {
        // User exists, log them in immediately
        setPet(data);
        setIsLoggedIn(true);
      }
    } catch (e) {
      setError("Server error. Is Python running?");
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8000/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if(data.name) {
        setPet(data); // Set the WHOLE pet object (hunger, name, message)
        setIsLoggedIn(true);
      }
    } catch (error) {
      alert("Could not connect to server. Is Python running?");
    }
  };

  const handleLogout = () => { // Remove async
    // 1. Tell the backend (Fire and forget - don't wait for it!)
    fetch('http://localhost:8000/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone }),
    }).catch(e => console.error("Logout log failed", e));

    // 2. Clear local React state immediately
    setIsLoggedIn(false);
    setFormData({ userName: '', phone: '', petName: '' });
    setPet({ hunger: 0, is_sleep: false, name: "Loading..." });
};


  const handleFeed = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/feed", { method: "POST",headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone }) });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setIsLoggedIn(false); // Force them to log in again
        return;
      }
      setPet(data); // Instantly update the UI with the new hunger level
      if (actionTimer.current) {
        clearTimeout(actionTimer.current);
      }
  
      setCurrentAction("eating");
  
      // 2. Start the new timer and save its ID in the Ref
      actionTimer.current = setTimeout(async () => {
        setCurrentAction(null);
        actionTimer.current = null; // Clear the ref once finished
      }, 3000);
    } catch (error) {
      console.error("Error feeding pet:", error);
    }
  };
  
  const handleWake = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/wake", { method: "POST",headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone }) });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setIsLoggedIn(false); // Force them to log in again
        return;
      }
      setPet(data); // Instantly update the UI to show the pet is awake
      if (actionTimer.current) {
        clearTimeout(actionTimer.current);
      }
  
      setCurrentAction("waking");
  
      // 2. Start the new timer and save its ID in the Ref
      actionTimer.current = setTimeout(async () => {
        setCurrentAction(null);
        actionTimer.current = null; // Clear the ref once finished
      }, 6000);
    } catch (error) {
      console.error("Error waking pet:", error);
    }
  };

 

  const handleDance = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/dance", { method: "POST" ,headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone })});
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setIsLoggedIn(false); // Force them to log in again
        return;
      }
      setPet(data); 
      if (actionTimer.current) {
        clearTimeout(actionTimer.current);
      }
  
      setCurrentAction("dancing");
  
      // 2. Start the new timer and save its ID in the Ref
      actionTimer.current = setTimeout(async () => {
        setCurrentAction(null);
        actionTimer.current = null; // Clear the ref once finished
      }, 4000);
    } catch (error) {
      console.error("Error dancing pet:", error);
    }
  };


  const handlePetting = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/petting", { method: "POST" ,headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone })});
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setIsLoggedIn(false); // Force them to log in again
        return;
      }
      setPet(data); 
      if (actionTimer.current) {
        clearTimeout(actionTimer.current);
      }
  
      setCurrentAction("petting");
  
      // 2. Start the new timer and save its ID in the Ref
      actionTimer.current = setTimeout(async () => {
        setCurrentAction(null);
        actionTimer.current = null; // Clear the ref once finished
      }, 2000);
    } catch (error) {
      console.error("Error dancing pet:", error);
    }
  };


  const getDisplayImage = () => {
    if (currentAction === "eating") return "/images/puppyeat.gif";
    if (currentAction === "waking") return "/images/puppywake.gif";
    if (currentAction === "dancing") return "/images/Dancingpuppy.gif"
    if (currentAction === "petting") return "/images/pet-dog.gif"
    if (pet.is_sleep) return "/images/Sleeping Pup.gif";
    return "/images/beagle-dog_happy.gif";
  };

  const styles = {
    loginContainer: {
      height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5'
    },
    form: {
      backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '15px', width: '320px'
    },
    input: {
      padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px'
    },
    loginButton: {
      padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px'
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.form}>
          <h2 style={{ color: '#333', textAlign: 'center' }}>
            {view === 'login' ? '🐶 Welcome Back' : '🐣 New Pet'}
          </h2>
  
          {error && (
            <p style={{ color: 'red', fontSize: '12px', textAlign: 'center' }}>{error}</p>
          )}
  
          {view === 'login' ? (
            /* --- LOGIN VIEW --- */
            <form onSubmit={handleCheckUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                placeholder="Phone Number" 
                style={styles.input}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} 
                required 
              />
              <button type="submit" style={styles.loginButton}>Login</button>
              <p style={{ fontSize: '13px', textAlign: 'center' }}>
                New here? <span 
                  style={{ color: '#4CAF50', cursor: 'pointer', fontWeight: 'bold' }} 
                  onClick={() => { setView('signup'); setError(''); }}
                >Sign Up</span>
              </p>
            </form>
          ) : (
            /* --- SIGN UP VIEW --- */
            <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
  
              <input 
                placeholder="Your Name" 
                style={styles.input}
                value={formData.userName} // Controlled component
                onChange={(e) => setFormData({ 
                  ...formData, 
                  userName: e.target.value.replace(/[^a-zA-Z\s]/g, '') // Removes everything except letters/spaces
                })} 
                required 
              />

              <input 
                placeholder="Phone Number" 
                style={styles.input}
                value={formData.phone}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  phone: e.target.value.replace(/\D/g, '') // Removes everything except numbers
                })} 
                required 
              />

              <input 
                placeholder="Pet Name" 
                style={styles.input}
                value={formData.petName}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  petName: e.target.value.replace(/[^a-zA-Z\s]/g, '') // Removes everything except letters/spaces
                })} 
                required 
              />

              <button type="submit" style={styles.loginButton}>Create & Enter</button>
              
              <p style={{ fontSize: '13px', textAlign: 'center' }}>
                Already have a pet? <span 
                  style={{ color: '#4CAF50', cursor: 'pointer', fontWeight: 'bold' }} 
                  onClick={() => { setView('login'); setError(''); }}
                >Login</span>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 4. THE UI: What the user sees
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>{pet.name} your Cyberpet</h1>
      
      <div className="pet-display" style={{ 
        width: '350px',           // Fixed Width
        height: '350px',          // Fixed Height (Equal to width for a square frame)
        margin: '20px auto',      // Centers the frame
        display: 'flex',          // Centers the image inside the frame
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#fdfdfd', 
        borderRadius: '25px', 
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)', // Inset shadow makes it look like a screen
        overflow: 'hidden'        // Prevents images from leaking out
      }}>
        <img 
          src={getDisplayImage()} 
          alt="Rocky" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain', // THE SECRET: Keeps ratio without cropping
            padding: '10px'       // Optional: adds a little "breathing room" around the dog
          }} 
        />
      </div>
      <div style={{
        backgroundColor: '#fffbe6',
        border: '2px solid #ffe58f',
        padding: '10px',
        borderRadius: '10px',
        margin: '15px auto',
        width: '300px',
        height: '25px',
        fontWeight: 'bold',
        color: '#856404',
        fontFamily: 'monospace'
      }}>
        💬 {pet.message || "Rocky is chilling..."}
      </div>

      <div style={{ marginTop: '20px' }}>
        <p>Hunger Status:</p>
        <div style={{ 
          width: '300px', 
          height: '25px', 
          backgroundColor: '#e0e0df', 
          borderRadius: '12px', 
          margin: '0 auto',
          marginBottom: '30px',
          border: '2px solid #333',
          overflow: 'hidden'
        }}>
          <div style={{ 
            // Ensure the width is exactly hunger * 10
            width: `${Math.max(pet.hunger * 10, 5)}%`, 
            height: '100%', 
            backgroundColor: pet.hunger <= 2 ? '#ff4d4d' : '#4caf50', 
            transition: 'width 0.5s ease-in-out', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {/* Show the actual percentage text */}
            {pet.hunger > 0 ? `${(pet.hunger / 10) * 100}%` : "0%"}
          </div>
        </div>
      </div>
      {/* 1. MAIN ACTION BUTTONS */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px',           // Space between Feed, Wake, etc.
        marginBottom: '30px'    // THE KEY: Creates vertical space below this row
      }}>
        <button onClick={handleFeed} disabled={pet.is_sleep}>🍖 Feed</button>
        <button onClick={handleWake} disabled={!pet.is_sleep}>⏰ Wake Up</button>
        <button onClick={handleDance} disabled={pet.is_sleep}>🕺 Dance</button>
        <button onClick={handlePetting} disabled={pet.is_sleep}>👋 Pat</button>
      </div>

      {/* 2. LOGOUT SECTION (Centered and Smaller) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center' 
      }}>
        <button 
          onClick={handleLogout} 
          style={{
            backgroundColor: '#ff4d4f', 
            color: 'white', 
            border: 'none', 
            padding: '5px 12px',    // Reduced padding for a smaller look
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '13px',       // Smaller font size
            fontWeight: 'bold'
          }}
        >
          🏃 Logout
        </button>
      </div>
    </div>
    
  );
}


export default App;