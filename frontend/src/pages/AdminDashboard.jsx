import { useState, useEffect } from "react";
import api from "../api/axios";
import * as XLSX from "xlsx";
import Footer from "../components/Footer";
import UploadAllSubjects from "../components/UploadAllSubjects";
import { useNotification } from "../context/NotificationContext";
import { useOptions } from "../context/OptionsContext";

export default function AdminDashboard() {
  const { showNotification } = useNotification();
  const { options } = useOptions();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [resultTitle, setResultTitle] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [stats, setStats] = useState(null);
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [autoCreate, setAutoCreate] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showNewYear, setShowNewYear] = useState(false);
  const [newYearConfirm, setNewYearConfirm] = useState("");

  useEffect(() => {
    fetchStats();
    if (options.grades.length) setSelectedGrade(options.grades[0]);
    if (options.departments.length) setSelectedDept(options.departments[0]);
    if (options.sections?.length) setSelectedSection(options.sections[0]);
  }, [options]);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleUploadPreview = async () => {
    if (!file) {
      showNotification("يرجى اختيار ملف أولاً", "info");
      return;
    }
    setLoading(true);
    try {
      setPreviewData(null);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("grade", selectedGrade);
      formData.append("department", selectedDept);
      formData.append("section", selectedSection);
      formData.append("subjectName", subjectName);
      formData.append("resultTitle", resultTitle);

      const res = await api.post("/admin/upload-preview", formData, {
          onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
          }
      });
      setPreviewData(res.data);
