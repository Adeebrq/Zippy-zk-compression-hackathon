import React from 'react'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
  const navigate= useNavigate()
  return (
    <div>
        Landing page
        <button onClick={()=> navigate("/CreatorPage")}>creator</button>
        <button onClick={()=> navigate("/AttendeePage")}>Attendee</button>
    </div>
  )
}

export default LandingPage
