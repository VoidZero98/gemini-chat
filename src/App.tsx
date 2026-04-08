import { ConfigProvider } from "antd";
import { ChatWindow } from "@/pages/chatWindow";
import "./App.css";

/** 柔和粉主色：比 #db2777 更浅，整体更「粉嫩」不压眼 */
const chatTheme = {
  token: {
    colorPrimary: "#e879b9",
    colorPrimaryHover: "#e05a9f",
    colorPrimaryActive: "#d946a0",
    colorPrimaryBg: "#fdf4f8",
    colorPrimaryBgHover: "#fce7f3",
    colorPrimaryBorder: "#fbcfe8",
    colorLink: "#d946a0",
    colorLinkHover: "#c7368c",
    fontSize: 14,
  },
  components: {
    Button: {
      primaryShadow: "0 4px 14px rgba(232, 121, 185, 0.22)",
    },
    Input: {
      activeBorderColor: "#f9a8d4",
      hoverBorderColor: "#fce7f3",
      activeShadow: "0 0 0 2px rgba(251, 207, 232, 0.55)",
    },
    FloatButton: {
      colorPrimary: "#e879b9",
      colorPrimaryHover: "#e05a9f",
    },
  },
};

const App = () => (
  <ConfigProvider theme={chatTheme}>
    <div className="app-root">
      <div className="app-chat-shell">
        <ChatWindow />
      </div>
    </div>
  </ConfigProvider>
);

export default App;
