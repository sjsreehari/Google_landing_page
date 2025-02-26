import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Table from "./Table";
import "./App.css";

const API_URL = "https://api.github.com/repos/Foss-mce/fossmce-portfolios/contents/Portfolios";
const PR_API_URL = "https://api.github.com/repos/Foss-mce/fossmce-portfolios/pulls";
const COMMITS_API_URL = "https://api.github.com/repos/Foss-mce/fossmce-portfolios/commits";

const Dashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const navigate = useNavigate();
  const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);

      try {
        // Fetch portfolio files
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("No portfolios found.");

        const portfolios = await Promise.all(
          data.map(async (file) => {
            // Check open PRs
            const prResponse = await fetch(`${PR_API_URL}?state=open&head=Foss-mce:${file.name.replace(".md", "")}`, {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
              },
            });

            const prData = await prResponse.json();
            
            // Check if file was merged by looking at commits
            const commitsResponse = await fetch(`${COMMITS_API_URL}?path=Portfolios/${file.name}`, {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
              },
            });
            const commitsData = await commitsResponse.json();

            let status = "Not Merged";
            let reviewStatus = "Under Review";

            // If there are commits, it means the file was merged
            if (commitsData.length > 0) {
              status = "Merged";
              reviewStatus = "Merged";
            }
            // If there's an open PR, override to show it's still under review
            if (prData.length > 0 && prData[0].state === "open") {
              status = "Not Merged";
              reviewStatus = "Under Review";
            }

            return {
              name: file.name.replace(".md", ""),
              link: file.html_url,
              status,
              reviewStatus,
            };
          })
        );

        setSubmissions(portfolios);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(true);
      } finally {
        setTimeout(() => setLoading(false), 1000);
      }
    };

    fetchData();
  }, [GITHUB_TOKEN]);

  const handleViewClick = (url) => {
    window.open(url, '_blank');
  };

  return (
    <motion.div className="container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      {loading && (
        <motion.div className="loader-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="custom-loader"></div>
          <p className="loading-text">Fetching data, please wait...</p>
        </motion.div>
      )}

      {error && !loading && (
        <motion.div className="error-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p>⚠️ Failed to load data. Please try again later.</p>
        </motion.div>
      )}

      <motion.div className="dashboard" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1>Portfolio Dashboard</h1>

        <div className="stats">
          <motion.p whileHover={{ scale: 1.1 }}>📂 Submissions: {submissions.length}</motion.p>
          <motion.p whileHover={{ scale: 1.1 }}>✅ Merged: {submissions.filter((pr) => pr.status === "Merged").length}</motion.p>
          <motion.p whileHover={{ scale: 1.1 }}>🕵️ Under Review: {submissions.filter((pr) => pr.reviewStatus === "Under Review").length}</motion.p>
        </div>

        <motion.button 
          className="luxury-btn" 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }} 
          onClick={() => navigate("/table")}
        >
          View Submissions
        </motion.button>

        <motion.div className="submissions-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          {submissions.map((submission, index) => (
            <motion.div 
              key={index} 
              className="submission-row" 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6 }} 
              whileHover={{ scale: 1.03 }}
            >
              <div className="submission-name">
                <p>{submission.name}</p>
              </div>
              <div className="submission-status">
                <p className={`status ${submission.status === "Merged" ? "merged" : "not-merged"}`}>
                  {submission.status}
                </p>
              </div>
              <motion.button
                className="view-btn"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleViewClick(submission.link)}
              >
                View
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/table" element={<Table />} />
      </Routes>
    </Router>
  );
};

export default App;