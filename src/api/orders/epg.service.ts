import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '../../constants/enums/order.enums';

export interface EpgRegisterParams {
  orderNumber: string;
  amount: number;
  currency: string;
  returnUrl: string;
  failUrl: string;
  description?: string;
}

export interface EpgStatusResult {
  orderStatus: number | null;
  actionCode: string | null;
  actionCodeDescription: string | null;
  panMasked: string | null;
}

interface EpgConfig {
  apiUrl: string;
  userName: string;
  password: string;
  currency: string;
  amountMultiplier: number;
}

export function statusFromEpg(orderStatus: number | null): OrderStatus | null {
  switch (orderStatus) {
    case 0: return OrderStatus.PENDING;
    case 1:
    case 2: return OrderStatus.PAID;
    case 3: return OrderStatus.REVERSED;
    case 4: return OrderStatus.REFUNDED;
    case 6: return OrderStatus.FAILED;
    default: return null;
  }
}

@Injectable()
export class EpgService {
  private readonly logger = new Logger(EpgService.name);
  private readonly cfg: EpgConfig;

  constructor(config: ConfigService) {
    this.cfg = config.get<EpgConfig>('epg');
  }

  private async call(method: string, params: Record<string, string | number>): Promise<any> {
    const body = new URLSearchParams({
      userName: this.cfg.userName,
      password: this.cfg.password,
    });
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) body.append(k, String(v));
    }

    let res: Response;
    try {
      res = await fetch(`${this.cfg.apiUrl}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
    } catch (err) {
      this.logger.error(`EPG ${method} network error`, err as Error);
      throw new BadGatewayException('Payment gateway unavailable');
    }

    const text = await res.text();
    if (!res.ok) {
      this.logger.error(`EPG ${method} HTTP ${res.status}: ${text.slice(0, 200)}`);
      throw new BadGatewayException(`Payment gateway HTTP ${res.status}`);
    }

    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      this.logger.error(`EPG ${method} non-JSON response: ${text.slice(0, 200)}`);
      throw new BadGatewayException('Invalid payment gateway response');
    }

    const code = Number(json.errorCode ?? json.ErrorCode ?? 0);
    if (code !== 0) {
      const msg = json.errorMessage ?? json.ErrorMessage ?? `EPG error ${code}`;
      this.logger.warn(`EPG ${method} errorCode=${code}: ${msg}`);
      throw new BadGatewayException(msg);
    }
    return json;
  }

  async register(p: EpgRegisterParams): Promise<{ orderId: string; formUrl: string }> {
    const json = await this.call('register.do', {
      orderNumber: p.orderNumber,
      amount: p.amount,
      currency: p.currency,
      returnUrl: p.returnUrl,
      failUrl: p.failUrl,
      description: p.description ?? '',
    });
    if (!json.orderId || !json.formUrl) {
      this.logger.error(`EPG register.do returned no orderId/formUrl: ${JSON.stringify(json).slice(0, 200)}`);
      throw new BadGatewayException('Payment gateway did not return a payment URL');
    }
    return { orderId: json.orderId, formUrl: json.formUrl };
  }

  async getOrderStatusExtended(epgOrderId: string): Promise<EpgStatusResult> {
    const json = await this.call('getOrderStatusExtended.do', { orderId: epgOrderId });
    return {
      orderStatus: json.orderStatus ?? null,
      actionCode: json.actionCode != null ? String(json.actionCode) : null,
      actionCodeDescription: json.actionCodeDescription ?? null,
      panMasked: json.cardAuthInfo?.pan ?? null,
    };
  }

  async refund(epgOrderId: string, amount: number): Promise<void> {
    await this.call('refund.do', { orderId: epgOrderId, amount });
  }

  async reverse(epgOrderId: string): Promise<void> {
    await this.call('reverse.do', { orderId: epgOrderId });
  }
}
