import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getMyBookings } from "../api/bookingApi";

function Ticket() {
  const { bookingId } = useParams();

  const ticketRef = useRef(null);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const bookings = await getMyBookings();

        const selectedBooking = bookings.find(
          (item) => item._id === bookingId
        );

        if (!selectedBooking) {
          setError("Ticket not found");
          return;
        }

        setBooking(selectedBooking);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load ticket"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [bookingId]);

const downloadTicket = async () => {
  if (!booking || downloading) return;

  try {
    setDownloading(true);
    setError("");

    await document.fonts.ready;

    const show = booking.show;
    const movie = show?.movie;
    const theatre = show?.theatre;

    const width = 600;
    const padding = 60;
    const contentWidth = width - padding * 2;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not supported");
    }

    
    canvas.width = width;
    canvas.height = 1600;

    ctx.textBaseline = "top";

    
    const wrapText = (text, maxWidth) => {
      const words = String(text).split(/\s+/);
      const lines = [];
      let line = "";

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;

        if (ctx.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }

      if (line) {
        lines.push(line);
      }

      return lines;
    };

  
    const ticketDetails = [
      {
        label: "MOVIE",
        value: movie?.title || "Movie",
      },
      {
        label: "THEATRE",
        value: theatre?.name || "N/A",
      },
      {
        label: "LOCATION",
        value: theatre?.city || "N/A",
      },
      {
        label: "SHOW TIME",
        value: show?.showTime
          ? new Date(show.showTime).toLocaleString("en-IN")
          : "N/A",
      },
      {
        label: "SEATS",
        value: booking.seats.join(", "),
      },
      {
        label: "TOTAL AMOUNT",
        value: `INR ${booking.totalAmount}`,
      },
      {
        label: "STATUS",
        value: booking.status.toUpperCase(),
      },
    ];

    
    let detailsHeight = 0;

    for (const item of ticketDetails) {
      ctx.font = "20px Arial";

      const lines = wrapText(item.value, contentWidth);

      detailsHeight += 30 + lines.length * 28 + 35;
    }

    const headerHeight = 120;
    const detailsStartY = 190;

    const qrSize = 170;
    const qrSectionHeight = 260;
    const bookingIdHeight = 90;

    const totalHeight =
      detailsStartY +
      detailsHeight +
      qrSectionHeight +
      bookingIdHeight +
      40;

    
    canvas.height = totalHeight;
    ctx.textBaseline = "top";

    
    ctx.fillStyle = "#141414";
    ctx.fillRect(0, 0, width, totalHeight);

    
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(
      30,
      30,
      width - 60,
      totalHeight - 60
    );

    
    ctx.fillStyle = "#e50914";
    ctx.fillRect(
      30,
      30,
      width - 60,
      headerHeight
    );

    
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";

    ctx.font = "bold 38px Arial";
    ctx.fillText("IMovies", width / 2, 60);

    ctx.font = "18px Arial";
    ctx.fillText("MOVIE TICKET", width / 2, 110);

    
    ctx.textAlign = "left";

    let y = detailsStartY;

    for (const item of ticketDetails) {
      
      ctx.font = "bold 17px Arial";
      ctx.fillStyle = "#aaaaaa";
      ctx.fillText(item.label, padding, y);

      y += 30;

      
      ctx.font = "20px Arial";
      ctx.fillStyle = "#ffffff";

      const lines = wrapText(item.value, contentWidth);

      for (const line of lines) {
        ctx.fillText(line, padding, y);
        y += 28;
      }

      y += 35;
    }

    
    y += 5;

    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();

    y += 35;

    
    const qrSvg = ticketRef.current?.querySelector("svg");

    if (!qrSvg) {
      throw new Error("QR code not found");
    }

    const svgString = new XMLSerializer().serializeToString(qrSvg);

    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });

    const qrUrl = URL.createObjectURL(svgBlob);

    try {
      const qrImage = new Image();

      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
        qrImage.src = qrUrl;
      });

      const qrX = (width - qrSize) / 2;
      const qrY = y;

      
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        qrX - 10,
        qrY - 10,
        qrSize + 20,
        qrSize + 20
      );

    
      ctx.drawImage(
        qrImage,
        qrX,
        qrY,
        qrSize,
        qrSize
      );

      y += qrSize + 30;
    } finally {
      URL.revokeObjectURL(qrUrl);
    }

  
    ctx.textAlign = "center";
    ctx.font = "16px Arial";
    ctx.fillStyle = "#cccccc";
    ctx.fillText(
      "Scan for Booking Reference",
      width / 2,
      y
    );

    y += 50;

    
    ctx.font = "14px Arial";
    ctx.fillStyle = "#aaaaaa";
    ctx.fillText(
      `Booking ID: ${booking._id}`,
      width / 2,
      y
    );

    y += 50;

  
    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
      "Thank you for booking with IMovies!",
      width / 2,
      y
    );

    
    const link = document.createElement("a");

    link.download = `IMovies-Ticket-${booking._id}.png`;
    link.href = canvas.toDataURL("image/png");

    document.body.appendChild(link);
    link.click();
    link.remove();

  } catch (err) {
    console.error("Ticket download error:", err);
    setError("Unable to download ticket.");
  } finally {
    setDownloading(false);
  }
};
  if (loading) {
    return <p>Loading ticket...</p>;
  }

  if (!booking) {
    return (
      <div className="ticket-page">
        <h2>{error || "Ticket not found"}</h2>
        <Link to="/bookings">Back to My Bookings</Link>
      </div>
    );
  }

  const show = booking.show;

  const movie = show?.movie;

  const theatre = show?.theatre;

  return (
    <div className="ticket-page">

      <h1>🎟️ Your Movie Ticket</h1>

      <div className="ticket-card" ref={ticketRef}>

        <div className="ticket-header">
          <h2>🎬 IMovies</h2>
          <p>Movie Ticket Booking</p>
        </div>

        <div className="ticket-body">

          <h2>{movie?.title || "Movie"}</h2>

          <p>
            <strong>Theatre:</strong>{" "}
            {theatre?.name || "N/A"}
          </p>

          <p>
            <strong>Location:</strong>{" "}
            {theatre?.city || "N/A"}
          </p>

          <p>
            <strong>Date & Time:</strong>{" "}
            {show?.showTime
              ? new Date(show.showTime).toLocaleString("en-IN")
              : "N/A"}
          </p>

          <p>
            <strong>Seats:</strong>{" "}
            {booking.seats.join(", ")}
          </p>

          <p>
            <strong>Total Amount:</strong> ₹
            {booking.totalAmount}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            {booking.status}
          </p>

          <p className="ticket-booking-id">
            <strong>Booking ID:</strong>{" "}
            {booking._id}
          </p>

          <div className="ticket-qr">

            <QRCodeSVG
              value={booking._id}
              size={160}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              marginSize={2}
            />

            <p>Booking Reference QR</p>

          </div>

        </div>

        <div className="ticket-footer">
          <p>Thank you for booking with IMovies!</p>
        </div>

      </div>

      {error && <p className="ticket-error">{error}</p>}

      <button
        className="ticket-download-btn"
        onClick={downloadTicket}
        disabled={downloading}
      >
        {downloading ? "Downloading..." : "📥 Download Ticket"}
      </button>

      <Link to="/bookings" className="ticket-back-link">
        ← Back to My Bookings
      </Link>

    </div>
  );
}

export default Ticket;