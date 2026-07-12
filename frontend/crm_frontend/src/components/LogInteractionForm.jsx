import { useState } from "react";
import axios from "axios";

export default function LogInteractionForm(){

  const [form,setForm] = useState({
    hcp_name:"",
    interaction_type:"Meeting",
    date:"",
    topics_discussed:"",
    sentiment:"Positive",
    follow_up:""
  });

  const handleChange = (e)=>{
    setForm({
      ...form,
      [e.target.name]:e.target.value
    });
  };

  const submitForm = async ()=>{

    await axios.post(
      "http://127.0.0.1:8000/log_interaction",
      form
    );

    alert("Interaction logged successfully");
  };

  return(

    <div>

      <h2>Log HCP Interaction</h2>

      <input
        placeholder="HCP Name"
        name="hcp_name"
        onChange={handleChange}
      />

      <br/><br/>

      <select
        name="interaction_type"
        onChange={handleChange}
      >
        <option>Meeting</option>
        <option>Call</option>
        <option>Email</option>
      </select>

      <br/><br/>

      <input
        type="date"
        name="date"
        onChange={handleChange}
      />

      <br/><br/>

      <textarea
        placeholder="Topics Discussed"
        name="topics_discussed"
        onChange={handleChange}
      />

      <br/><br/>

      <select
        name="sentiment"
        onChange={handleChange}
      >
        <option>Positive</option>
        <option>Neutral</option>
        <option>Negative</option>
      </select>

      <br/><br/>

      <textarea
        placeholder="Follow-up Action"
        name="follow_up"
        onChange={handleChange}
      />

      <br/><br/>

      <button onClick={submitForm}>
        Save Interaction
      </button>

    </div>

  );

}