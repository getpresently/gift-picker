export function PresentlyMark() {
  return (
    <span style={{ fontFamily: "Geist, system-ui, sans-serif", fontSize: 12, color: "rgba(35,20,16,0.5)" }}>
      by{" "}
      <span
        style={{
          fontFamily: '"Instrument Serif", serif',
          fontStyle: "italic",
          fontSize: 15,
          color: "#C4477E",
          fontWeight: 500,
        }}
      >
        Presently
      </span>
    </span>
  );
}
