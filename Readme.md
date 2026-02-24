# 📘 VTOP-C  
### Smart Student Life & Academic Management Platform

> A centralized student ecosystem integrating academics, collaboration, hostel life, and productivity into one unified dashboard.

---

## Overview

VTOP-C is an EdTech + Student-Life platform designed to simplify campus life by combining:

- Academic tracking  
- Attendance monitoring  
- Marks overview  
- Academic calendar  
- Note sharing  
- Roommate matching  
- Task & assignment management  
- Student forum  

Instead of switching between multiple portals and messaging groups, students get a **single, structured interface** to manage everything.

---

## Problem Statement

Students in large universities face:

- Fragmented academic portals  
- Manual attendance calculations  
- Scattered notes across platforms  
- Random roommate allocation  
- Missed assignment deadlines  
- Lack of centralized peer collaboration  

There is no unified platform combining academic visibility and student-life management.

---

## Our Solution

VTOP-C acts as a **Student Operating System**, integrating:

- Academic insights  
- Social collaboration  
- Hostel compatibility tools  
- Productivity management  

All inside one streamlined dashboard.

---

## Features

### Academic Dashboard
- Subject-wise marks overview  
- Attendance tracking  
- Attendance percentage monitoring  
- Academic calendar integration  
- Exam schedule display  

---

### Smart Note Sharing
- Upload/download subject-wise notes  
- Organized academic resources  
- Peer-driven content sharing  

---

### Roommate Matching
- Match based on:
  - Sleep schedule  
  - Cleanliness preference  
  - Study habits  
  - Academic year/branch  
- Reduces hostel conflicts  
- Improves compatibility  

---

### Task & Assignment Hub
- Assignment tracking  
- Project management  
- Deadline organization  
- Productivity improvement  

---

### Student Forum
- Academic doubt solving  
- Peer-to-peer discussions  
- Community-based support  

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Django  
- **Database:** SQLite / PostgreSQL  
- **Authentication:** Django Authentication System  
- **Deployment:** Render  

---

## Authentication & Security

- Secure login system  
- User-based dashboards  
- Protected routes  
- Controlled access to student directory  

---

## Future Improvements

- AI-based roommate compatibility scoring  
- Predictive attendance alerts  
- Smart academic performance analytics  
- AI-powered note summarization  
- Mobile application version  
- Official API integration  

---

## Installation (Local Setup)

```bash
# Clone the repository
git clone https://github.com/your-username/vtop-c.git

# Navigate into project
cd vtop-c

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Run development server
python manage.py runserver