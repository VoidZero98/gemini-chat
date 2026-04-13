import { useEffect, useState } from "react";
import {
  App as AntApp,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Space,
  Typography,
  Upload,
} from "antd";
import ImgCrop from "antd-img-crop";
import type { UploadRequestOption as RcUploadRequestOption } from "rc-upload/lib/interface";
import { useNavigate } from "react-router-dom";
import { AuthApi, isApiClientError } from "@/api";
import type { AuthUser, UpdateProfilePayload } from "@/api/auth";
import { resolveAvatarUrl } from "@/utils/avatar";
import styles from "./ProfilePage.module.css";

type ProfileFormValues = {
  account: string;
  avatar: string;
  bio: string;
  password: string;
};

const toPayload = (values: ProfileFormValues): UpdateProfilePayload => {
  const payload: UpdateProfilePayload = {
    account: values.account.trim(),
    avatar: values.avatar.trim(),
    bio: values.bio.trim(),
  };
  const nextPassword = values.password.trim();
  if (nextPassword) {
    payload.password = nextPassword;
  }
  return payload;
};

export const ProfilePage = () => {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [form] = Form.useForm<ProfileFormValues>();
  const watchedAvatar = Form.useWatch("avatar", form);
  const watchedAccount = Form.useWatch("account", form);
  const previewAvatar = resolveAvatarUrl(
    watchedAvatar?.trim() || currentUser?.avatar || "",
  );

  useEffect(() => {
    const loadProfile = async (): Promise<void> => {
      try {
        const data = await AuthApi.getProfile();
        setCurrentUser(data);
        form.setFieldsValue({
          account: data.account ?? "",
          avatar: data.avatar ?? "",
          bio: data.bio ?? "",
          password: "",
        });
      } catch (error) {
        const errorMessage = isApiClientError(error)
          ? error.message
          : "加载个人资料失败";
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, [form, message]);

  const handleSubmit = async (values: ProfileFormValues): Promise<void> => {
    try {
      setSaving(true);
      const payload = toPayload(values);
      const updatedUser = await AuthApi.updateProfile(payload);
      setCurrentUser(updatedUser);
      form.setFieldValue("password", "");
      message.success("个人资料已更新");
    } catch (error) {
      const errorMessage = isApiClientError(error)
        ? error.message
        : "更新个人资料失败";
      message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (
    options: RcUploadRequestOption,
  ): Promise<void> => {
    const { file, onError, onSuccess } = options;
    if (!(file instanceof File)) {
      onError?.(new Error("无效的文件对象"));
      return;
    }
    try {
      setUploadingAvatar(true);
      const updatedUser = await AuthApi.uploadAvatar(file);
      setCurrentUser(updatedUser);
      form.setFieldValue("avatar", updatedUser.avatar ?? "");
      message.success("头像上传成功");
      onSuccess?.({}, file);
    } catch (error) {
      const errorMessage = isApiClientError(error)
        ? error.message
        : "头像上传失败";
      message.error(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card} loading={loading}>
        <div className={styles.titleRow}>
          <Typography.Title level={3} className={styles.title}>
            个人资料
          </Typography.Title>
          <Button className={styles.backBtn} onClick={() => navigate("/chat")}>
            返回聊天
          </Button>
        </div>
        <div className={styles.subTitle}>
          编辑头像、用户名、密码和简介。密码留空表示不修改。
        </div>
        <div className={styles.avatarPreviewBox}>
          <Avatar
            size={64}
            className={styles.avatarPreviewImage}
            src={previewAvatar}
          >
            {(watchedAccount?.trim() || currentUser?.account || "我")
              .slice(0, 1)
              .toUpperCase()}
          </Avatar>
          <div className={styles.avatarPreviewText}>
            头像预览（支持 URL 或 `/static/...` 路径）
          </div>
        </div>
        <Form<ProfileFormValues>
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{
            account: currentUser?.account ?? "",
            avatar: currentUser?.avatar ?? "",
            bio: currentUser?.bio ?? "",
            password: "",
          }}
        >
          <Form.Item
            label="用户名"
            name="account"
            rules={[
              { required: true, message: "请输入用户名" },
              { min: 4, message: "用户名至少 4 位" },
              { max: 32, message: "用户名最多 32 位" },
            ]}
          >
            <Input maxLength={32} placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="头像地址"
            name="avatar"
            rules={[{ max: 255, message: "头像地址最多 255 字符" }]}
          >
            <Input
              maxLength={255}
              placeholder="请输入头像 URL 或静态资源路径"
              addonAfter={
                <ImgCrop
                  rotationSlider
                  quality={0.92}
                  modalTitle="裁剪头像"
                  modalOk="确认"
                  modalCancel="取消"
                  aspect={1}
                  minZoom={1}
                >
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const maxSize = 2 * 1024 * 1024;
                      if (file.size > maxSize) {
                        message.error("头像文件不能超过 2MB");
                        return Upload.LIST_IGNORE;
                      }
                      return true;
                    }}
                    customRequest={(options) => {
                      void handleUploadAvatar(options);
                    }}
                  >
                    <Button type="link" size="small" loading={uploadingAvatar}>
                      本地上传
                    </Button>
                  </Upload>
                </ImgCrop>
              }
            />
          </Form.Item>
          <Form.Item
            label="简介"
            name="bio"
            rules={[{ max: 255, message: "简介最多 255 字符" }]}
          >
            <Input.TextArea
              maxLength={255}
              showCount
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="介绍一下你自己"
            />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="password"
            rules={[
              {
                validator: (_, value: string) => {
                  const text = value?.trim() ?? "";
                  if (!text) {
                    return Promise.resolve();
                  }
                  if (text.length < 6) {
                    return Promise.reject(new Error("密码至少 6 位"));
                  }
                  if (text.length > 64) {
                    return Promise.reject(new Error("密码最多 64 位"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password maxLength={64} placeholder="不改密码可留空" />
          </Form.Item>
          <Space size={10}>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              disabled={loading}
              className={styles.saveBtn}
            >
              保存修改
            </Button>
            <Button
              onClick={() => navigate("/chat")}
              disabled={saving}
              className={styles.cancelBtn}
            >
              取消
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};
