import axios from "axios";

function FileUpload({ setData }) {
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const form = new FormData();
    form.append("file", file);

    const res = await axios.post("http://localhost:8000/predict", form);
    setData(res.data);
  };

  return (
    <div className="p-4">
      <input type="file" onChange={handleUpload} className="p-2 border" />
    </div>
  );
}

export default FileUpload;
