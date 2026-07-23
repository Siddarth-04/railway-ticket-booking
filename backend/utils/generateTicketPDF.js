const PDFDocument = require('pdfkit');

const generateTicketPDF = (res, booking) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=ticket-${booking.pnr_number}.pdf`
  );

  doc.pipe(res);

  // Title
  doc
    .fontSize(22)
    .fillColor('#0d47a1')
    .text('RailWayPro Ticket', { align: 'center' })
    .moveDown(2);

  // Booking Details
  doc
    .fontSize(12)
    .fillColor('#000000')
    .text(`PNR Number: ${booking.pnr_number}`)
    .text(`Passenger: ${booking.passenger_name}`)
    .text(`Train: ${booking.train_name}`)
    .text(`Route: ${booking.source} → ${booking.destination}`)
    .text(`Journey Date: ${new Date(booking.journey_date).toDateString()}`)
    .text(`Departure: ${booking.departure_time}`)
    .text(`Arrival: ${booking.arrival_time}`)
    .text(`Seat(s): ${booking.seat_numbers}`)
    .text(`Total Amount: ₹${booking.total_amount}`)
    .text(`Status: ${booking.booking_status}`)
    .moveDown(2);

  doc
    .fontSize(10)
    .fillColor('gray')
    .text('Thank you for choosing RailWayPro.', { align: 'center' });

  doc.end();
};

module.exports = generateTicketPDF;