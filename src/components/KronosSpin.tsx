import { Spin } from "antd";

const KronosSymbol = (props: any) => {
  const { width = 70, height = 70 } = props; // Set default size as 100px if no props provided

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={`${width}px`}
      height={`${height}px`}
      viewBox="0 0 100 100"
      fill="none"
      style={{ animation: "spin 2s linear infinite" }}
    >
      <circle
        cx="50"
        cy="50"
        r="35"
        strokeWidth="8"
        stroke="#421cef"
        strokeDasharray="30 5"
      />
      <circle
        cx="50"
        cy="50"
        r="20"
        strokeWidth="4"
        stroke="#89acff"
        strokeDasharray="15 5"
      />
    </svg>
  );
};

export default function KronosSpin(props: any) {
  return (
    <Spin
      indicator={<KronosSymbol width={props.width} height={props.height} />}
      size="large"
    />
  );
}
