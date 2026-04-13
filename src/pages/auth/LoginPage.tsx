import { useEffect, useMemo, useState } from "react";
import { App as AntApp, Button, Card, Form, Input, Tabs } from "antd";
import { useNavigate } from "react-router-dom";
import { AuthApi, isApiClientError } from "@/api";
import type { CaptchaResponse } from "@/api/auth";
import styles from "./LoginPage.module.css";

type AuthMode = "login" | "register";

type AuthFormValues = {
  account: string;
  password: string;
  captchaCode: string;
};

const tabItems = [
  { key: "login", label: "登录" },
  { key: "register", label: "注册" },
];

export const LoginPage = () => {
  const { message } = AntApp.useApp();
  const [mode, setMode] = useState<AuthMode>("login");
  const [captcha, setCaptcha] = useState<CaptchaResponse | null>(null);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm<AuthFormValues>();
  const navigate = useNavigate();

  const submitLabel = useMemo(() => {
    return mode === "login" ? "登录" : "注册";
  }, [mode]);

  const loadCaptcha = async (): Promise<void> => {
    try {
      setCaptchaLoading(true);
      const data = await AuthApi.getCaptcha();
      setCaptcha(data);
    } catch (error) {
      const errorMessage = isApiClientError(error)
        ? error.message
        : "获取验证码失败，请重试";
      message.error(errorMessage);
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    void loadCaptcha();
  }, []);

  const onFinish = async (values: AuthFormValues): Promise<void> => {
    if (!captcha?.captchaId) {
      message.warning("验证码加载中，请稍后再试");
      return;
    }
    try {
      setSubmitLoading(true);
      const payload = {
        account: values.account.trim(),
        password: values.password,
        captchaId: captcha.captchaId,
        captchaCode: values.captchaCode.trim(),
      };
      if (mode === "login") {
        await AuthApi.login(payload);
      } else {
        await AuthApi.register(payload);
      }
      message.success(`${submitLabel}成功`);
      navigate("/chat", { replace: true });
    } catch (error) {
      const errorMessage = isApiClientError(error)
        ? error.message
        : `${submitLabel}失败，请稍后重试`;
      message.error(errorMessage);
      form.setFieldValue("captchaCode", "");
      void loadCaptcha();
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <h2 className={styles.title}>Gemini Chat</h2>
        <p className={styles.subTitle}>登录后开始你的 AI 对话</p>
        <Tabs
          centered
          activeKey={mode}
          items={tabItems}
          onChange={(key) => setMode(key as AuthMode)}
        />
        <Form<AuthFormValues> layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            label="账号"
            name="account"
            rules={[
              { required: true, message: "请输入账号" },
              { min: 4, message: "账号至少 4 位" },
            ]}
          >
            <Input size="large" maxLength={32} placeholder="请输入账号" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码至少 6 位" },
            ]}
          >
            <Input.Password
              size="large"
              maxLength={64}
              placeholder="请输入密码"
            />
          </Form.Item>
          <Form.Item
            label="验证码"
            name="captchaCode"
            rules={[
              { required: true, message: "请输入验证码" },
              { len: 4, message: "验证码长度应为 4 位" },
            ]}
          >
            <div className={styles.captchaRow}>
              <Input
                size="large"
                maxLength={4}
                placeholder="请输入验证码"
                autoComplete="off"
              />
              {captcha?.image ? (
                <img
                  src={captcha.image}
                  alt="captcha"
                  className={styles.captchaImage}
                  onClick={() => void loadCaptcha()}
                />
              ) : (
                <Button
                  block
                  size="large"
                  loading={captchaLoading}
                  onClick={() => void loadCaptcha()}
                >
                  获取验证码
                </Button>
              )}
            </div>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              block
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitLoading}
            >
              {submitLabel}
            </Button>
          </Form.Item>
        </Form>
        <div className={styles.actionHint}>点击验证码图片可刷新</div>
      </Card>
    </div>
  );
};
