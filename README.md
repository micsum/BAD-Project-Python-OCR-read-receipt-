# FastDPay - OCR Scan, Bill Splitting and Expense Sharing Web Application

FastDPay is a web application designed to simplify the process of splitting bills and sharing expenses among friends and family. Whether you're dining out, traveling, or sharing any other expenses, FastDPay makes it easy to track and settle up with others.

---

## Features

- **Add Others to the Bill**: You can add friends and family members to a bill, allowing them to claim their respective expenses.
- **Automatic Calculations**: FastDPay automatically calculates discounts and splits the bill accurately.
- **OCR Scan**: Scans bills using Optical Character Recognition (OCR), extracting product names and filling in the information for the host.
- **Payment Integration**: Directly send payments to the host of claimed expenses via **PayMe**.
- **Bill History**: Keep track of past bills and expenses with detailed history records.
- **Real-Time Claim Updates**: See which items other users have claimed in real-time.
- **Notifications**: Receive updates and reminders about bills and payments.

---

## Tech Stack

- **Frontend**: HTML, Tailwind CSS, JavaScript
- **Backend**: Python (Django framework), Socket.IO
- **OCR**: Integrated OCR (Tesseract)
- **Payment Integration**: Stripe API for TopUp (trial)
- **Database**: PostgreSQL
- **Hosting**: AWS EC2 for cloud hosting
- **Authentication:** JWT, Session Management
- **File Upload:** Formidable

---

## Demo

You can explore the live version of the application at [FastDPay](https://fastdpay.online).

For a visual demo of the features:

![Jun-23-2023 04-51-52](https://github.com/user-attachments/assets/10ea8f7e-8657-4f0e-b369-382462d802ec)
![Jun-23-2023 04-48-15](https://github.com/user-attachments/assets/555f887f-d6e6-4ccc-b125-0a7feed9f4d2)

### Google Slides
https://docs.google.com/presentation/d/1-Y_rXD8O-qd2xEDPVG94jUQMcvsnpWXpyDW4-3KvWLg/edit?usp=sharing

## Acknowledgments
Thanks to [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) for the OCR integration that powers the scanning feature.
