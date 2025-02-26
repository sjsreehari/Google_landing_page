import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Table from "./Table";
import Modal from "./ModalCard";
import "./App.css";

const API_URL = "https://api.github.com/repos/Foss-mce/fossmce-portfolios/contents/Portfolios";
const PR_API_URL = "https://api.github.com/repos/Foss-mce/fossmce-portfolios/pulls";

const Dashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [githubStats, setGithubStats] = useState(null);

  const navigate = useNavigate();
  const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);

      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error("No portfolios found.");

        const portfolios = await Promise.all(
          data.map(async (file) => {
            const prResponse = await fetch(`${PR_API_URL}?head=Foss-mce:${file.name.replace(".md", "")}`, {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
              },
            });

            const prData = await prResponse.json();
            let status = "Not Merged";
            let reviewStatus = "Under Review";

            if (prData.length > 0) {
              const pr = prData[0];
              if (pr.merged || pr.state === "closed") {
                status = "Merged";
                reviewStatus = "Merged";
              }
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

  const handleViewClick = async (submission) => {
    setSelectedSubmission(submission);

    try {
      const userStatsResponse = await fetch(`https://api.github.com/users/${submission.name}`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });
      const userStats = await userStatsResponse.json();

      const reposResponse = await fetch(`https://api.github.com/users/${submission.name}/repos`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });
      const repos = await reposResponse.json();

      const pinnedRepos = repos.slice(0, 2).map((repo) => ({
        name: repo.name,
        url: repo.html_url,
      }));

      setGithubStats({
        name: userStats.login,
        profileUrl: userStats.html_url,
        followers: userStats.followers,
        totalCommits: repos.reduce((total, repo) => total + repo.stargazers_count, 0), // Approximate commit count
        pinnedRepos: pinnedRepos.length > 0 ? pinnedRepos : [],
      });
    } catch (error) {
      console.error("Error fetching GitHub stats:", error);
      setGithubStats(null);
    }
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

        <motion.button className="luxury-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate("/table")}>
          View Submissions
        </motion.button>

        <motion.div className="submissions-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          {submissions.map((submission, index) => (
            <motion.div key={index} className="submission-row" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} whileHover={{ scale: 1.03 }}>
              <div className="submission-name">
                <p>{submission.name}</p>
              </div>
              <div className="submission-status">
                <p className={`status ${submission.status === "Merged" ? "merged" : "not-merged"}`}>{submission.status}</p>
              </div>
              <div className="submission-link">
                <button className="view-btn" onClick={() => handleViewClick(submission)}>View</button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {selectedSubmission && <Modal submission={selectedSubmission} githubStats={githubStats} onClose={() => setSelectedSubmission(null)} />}
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
