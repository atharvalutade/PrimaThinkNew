import { jsPDF } from "jspdf";

interface CertificateData {
  name: string;
  domain: string;
  completionDate: Date;
  certificateId: string;
}

export function generateCertificate(data: CertificateData) {
  const pdf = new jsPDF("landscape", "mm", "a4");

  const img = new Image();
  img.src = "/certificate-template.png";

  img.onload = () => {
    pdf.addImage(img, "PNG", 0, 0, 297, 210);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);

    pdf.text(data.name, 148.5, 110, {
      align: "center",
    });

    pdf.save(`${data.name}-certificate.pdf`);
  };
}