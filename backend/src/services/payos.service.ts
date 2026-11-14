import dotenv from 'dotenv';
import { PayOS } from '@payos/node';
import { config } from '../config';

export interface PayOSCreateLinkParams {
  orderCode?: number;
  amount: number;
  description: string;
  cancelUrl?: string;
  returnUrl?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface PayOSCreateLinkResult {
  orderCode: number;
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  accountNumber?: string;
  accountName?: string;
  bin?: string;
  amount: number;
  description: string;
  status: string;
  isMock?: boolean;
}

export interface PayOSPaymentInfoResult {
  orderCode: number;
  paymentLinkId?: string;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'UNDERPAID' | 'EXPIRED' | 'PROCESSING' | 'FAILED' | string;
  createdAt?: string;
  transactions?: any[];
  cancellationReason?: string | null;
  isMock?: boolean;
}

class PayOSService {
  private client: PayOS | null = null;

  constructor() {
    this.initClient();
  }

  /**
   * Khởi tạo PayOS Client nếu đã có thông tin cấu hình trong .env
   */
  public initClient(): void {
    // Tự động load lại .env với override: true để cập nhật key ngay khi người dùng điền vào file .env
    dotenv.config({ override: true });

    const clientId = process.env.PAYOS_CLIENT_ID?.trim() || config.payos.clientId;
    const apiKey = process.env.PAYOS_API_KEY?.trim() || config.payos.apiKey;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim() || config.payos.checksumKey;

    if (clientId && apiKey && checksumKey) {
      try {
        this.client = new PayOS({
          clientId,
          apiKey,
          checksumKey,
        });
        console.log('✅ [PayOS] Đã kết nối thành công với Client ID:', clientId.slice(0, 8) + '***');
      } catch (err: any) {
        console.error('❌ [PayOS] Lỗi khởi tạo PayOS Client:', err.message);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  /**
   * Kiểm tra xem hệ thống đã được điền đủ thông tin PayOS chưa
   */
  public isConfigured(): boolean {
    dotenv.config({ override: true });
    const clientId = process.env.PAYOS_CLIENT_ID?.trim() || config.payos.clientId;
    const apiKey = process.env.PAYOS_API_KEY?.trim() || config.payos.apiKey;
    const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim() || config.payos.checksumKey;

    if (clientId && apiKey && checksumKey) {
      if (!this.client) {
        this.initClient();
      }
      return Boolean(this.client);
    }
    return false;
  }

  /**
   * Chuẩn hóa nội dung chuyển khoản cho PayOS (PayOS yêu cầu tối đa 25 ký tự, không chứa ký tự đặc biệt)
   */
  public normalizeDescription(desc: string): string {
    const clean = desc
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
      .replace(/[^a-zA-Z0-9 ]/g, '') // Chỉ giữ chữ, số và khoảng trắng
      .trim();
    return clean.slice(0, 25);
  }

  /**
   * Sinh mã orderCode số nguyên duy nhất cho PayOS (6 - 9 chữ số)
   */
  public generateOrderCode(): number {
    const timestampPart = Date.now().toString().slice(-6);
    const randomPart = Math.floor(100 + Math.random() * 900).toString();
    return Number(`${randomPart}${timestampPart}`);
  }

  /**
   * Tạo liên kết thanh toán qua PayOS (Trả về checkoutUrl, qrCode, orderCode, thông tin ngân hàng)
   */
  public async createPaymentLink(params: PayOSCreateLinkParams): Promise<PayOSCreateLinkResult> {
    const orderCode = params.orderCode || this.generateOrderCode();
    const cleanDescription = this.normalizeDescription(params.description || `HP ${orderCode}`);
    const frontendUrl = config.frontendUrl || 'http://localhost:5173';
    const returnUrl = params.returnUrl || `${frontendUrl}/student/payments?status=PAID&orderCode=${orderCode}`;
    const cancelUrl = params.cancelUrl || `${frontendUrl}/student/payments?status=CANCELLED&orderCode=${orderCode}`;

    if (!this.isConfigured() || !this.client) {
      console.warn('⚠️ [PayOS] Chưa cấu hình Client ID / API Key. Chạy chế độ mô phỏng (Demo Mode).');
      // Chế độ mô phỏng (Demo Mode) khi chưa điền API Key
      const defaultBin = '970422'; // MBBank
      const defaultAccountNo = '988866889999';
      const defaultAccountName = 'CONG TY CO PHAN GIAO DUC EDUCENTER';
      const mockQr = `https://img.vietqr.io/image/${defaultBin}-${defaultAccountNo}-compact2.png?amount=${params.amount}&addInfo=${encodeURIComponent(
        cleanDescription
      )}&accountName=${encodeURIComponent(defaultAccountName)}`;

      return {
        orderCode,
        paymentLinkId: `mock_pl_${orderCode}`,
        checkoutUrl: mockQr,
        qrCode: mockQr,
        accountNumber: defaultAccountNo,
        accountName: defaultAccountName,
        bin: defaultBin,
        amount: params.amount,
        description: cleanDescription,
        status: 'PENDING',
        isMock: true,
      };
    }

    try {
      const response = await this.client.paymentRequests.create({
        orderCode,
        amount: params.amount,
        description: cleanDescription,
        returnUrl,
        cancelUrl,
        buyerName: params.buyerName,
        buyerEmail: params.buyerEmail,
        buyerPhone: params.buyerPhone,
        items: params.items,
      });

      return {
        orderCode: response.orderCode,
        paymentLinkId: response.paymentLinkId,
        checkoutUrl: response.checkoutUrl,
        qrCode: response.qrCode,
        accountNumber: response.accountNumber,
        accountName: response.accountName,
        bin: response.bin,
        amount: response.amount,
        description: response.description,
        status: response.status,
        isMock: false,
      };
    } catch (error: any) {
      console.error('❌ [PayOS] Lỗi tạo payment link:', error);
      throw new Error(error?.message || 'Không thể tạo liên kết thanh toán PayOS');
    }
  }

  /**
   * Đối chiếu mã thanh toán trực tiếp với PayOS qua Order Code hoặc Payment Link ID
   */
  public async getPaymentLinkInformation(orderCodeOrId: number | string): Promise<PayOSPaymentInfoResult> {
    if (!this.isConfigured() || !this.client) {
      return {
        orderCode: Number(orderCodeOrId) || 0,
        amount: 0,
        amountPaid: 0,
        amountRemaining: 0,
        status: 'PENDING',
        isMock: true,
      };
    }

    try {
      const info = await this.client.paymentRequests.get(orderCodeOrId as any);
      return {
        orderCode: info.orderCode,
        paymentLinkId: info.id,
        amount: info.amount,
        amountPaid: info.amountPaid,
        amountRemaining: info.amountRemaining,
        status: info.status as any,
        createdAt: info.createdAt,
        transactions: info.transactions,
        cancellationReason: info.cancellationReason,
        isMock: false,
      };
    } catch (error: any) {
      console.error(`❌ [PayOS] Lỗi lấy thông tin đơn hàng ${orderCodeOrId}:`, error);
      throw new Error(error?.message || 'Không thể lấy thông tin thanh toán từ PayOS');
    }
  }

  /**
   * Xác thực chữ ký dữ liệu Webhook từ PayOS
   */
  public async verifyWebhookData(webhookBody: any): Promise<any> {
    if (!this.isConfigured() || !this.client) {
      throw new Error('PayOS chưa được cấu hình Client Key / Checksum Key');
    }
    return await this.client.webhooks.verify(webhookBody);
  }

  /**
   * Đăng ký và xác nhận Webhook URL với PayOS
   */
  public async confirmWebhookUrl(webhookUrl: string): Promise<any> {
    if (!this.isConfigured() || !this.client) {
      throw new Error('PayOS chưa được cấu hình Client Key / Checksum Key');
    }
    return await this.client.webhooks.confirm(webhookUrl);
  }
}

export const payosService = new PayOSService();
export default payosService;

