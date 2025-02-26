import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import "./Table.css"; // Import CSS

const Table = () => {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch data from GitHub API (files in "Portfolios")
    fetch("https://api.github.com/repos/Foss-mce/fossmce-portfolios/contents/Portfolios")
      .then((response) => response.json())
      .then((files) => {
        // Fetch commit details for each file to get the date
        const filePromises = files.map((file) =>
          fetch(`https://api.github.com/repos/Foss-mce/fossmce-portfolios/commits?path=Portfolios/${file.name}`)
            .then((commitResponse) => commitResponse.json())
            .then((commits) => {
              // Get the date of the most recent commit for each file
              const commitDate = commits[0]?.commit?.committer?.date;
              const formattedDate = commitDate ? new Date(commitDate).toLocaleDateString() : "Unknown";
              return {
                name: file.name,
                date: formattedDate,
                link: `https://github.com/Foss-mce/fossmce-portfolios/blob/main/Portfolios/${file.name}`, // GitHub URL for viewing the file
              };
            })
        );

        // Once all promises resolve, update the data state
        Promise.all(filePromises)
          .then((formattedData) => {
            setData(formattedData);
          })
          .catch((error) => console.error("Error fetching commits:", error));
      })
      .catch((error) => console.error("Error fetching files:", error));
  }, []);

  // Function to download table as PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Submissions Table", 20, 10);
    doc.autoTable({
      head: [["Name", "Date of Submission", "Link"]],
      body: data.map((row) => [row.name, row.date, row.link]),
    });
    doc.save("submissions.pdf");
  };

  return (
    <div className="table-container">
      <h2 className="table-title">Submissions Table</h2>

      {/* Buttons above the table */}
      <div className="btn-container">
        <button className="luxury-btn" onClick={downloadPDF}>
          Download PDF
        </button>
        <button className="luxury-btn" onClick={() => navigate(-1)}>
          Previous Page
        </button>
      </div>

      {/* Scrollable Table */}
      <div className="table-wrapper">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date of Submission</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.date}</td>
                <td>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
