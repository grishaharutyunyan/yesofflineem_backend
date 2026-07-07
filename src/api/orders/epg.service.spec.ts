import { EpgService, statusFromEpg } from './epg.service';
import { OrderStatus } from '../../constants/enums/order.enums';

function makeConfig() {
  return {
    get: (key: string) =>
      key === 'epg'
        ? { apiUrl: 'https://epg.test', userName: 'u', password: 'p', currency: '051', amountMultiplier: 100 }
        : undefined,
  } as any;
}

describe('statusFromEpg', () => {
  it('maps EPG codes to OrderStatus', () => {
    expect(statusFromEpg(1)).toBe(OrderStatus.PAID);
    expect(statusFromEpg(2)).toBe(OrderStatus.PAID);
    expect(statusFromEpg(3)).toBe(OrderStatus.REVERSED);
    expect(statusFromEpg(4)).toBe(OrderStatus.REFUNDED);
    expect(statusFromEpg(6)).toBe(OrderStatus.FAILED);
    expect(statusFromEpg(0)).toBe(OrderStatus.PENDING);
    expect(statusFromEpg(null)).toBeNull();
  });
});

describe('EpgService.register', () => {
  it('posts form-urlencoded with credentials and returns orderId + formUrl', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ errorCode: 0, orderId: 'oid-1', formUrl: 'https://epg.test/p/x' }),
    });
    (global as any).fetch = fetchMock;

    const svc = new EpgService(makeConfig());
    const res = await svc.register({
      orderNumber: 'on-1', amount: 500, currency: '051',
      returnUrl: 'https://f/ok', failUrl: 'https://f/fail', description: 'Test',
    });

    expect(res).toEqual({ orderId: 'oid-1', formUrl: 'https://epg.test/p/x' });
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://epg.test/register.do');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(opts.body).toContain('userName=u');
    expect(opts.body).toContain('password=p');
    expect(opts.body).toContain('orderNumber=on-1');
    expect(opts.body).toContain('amount=500');
  });

  it('throws when EPG returns a non-zero errorCode', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ errorCode: 5, errorMessage: 'Empty amount' }),
    });
    const svc = new EpgService(makeConfig());
    await expect(
      svc.register({ orderNumber: 'x', amount: 0, currency: '051', returnUrl: 'a', failUrl: 'b' }),
    ).rejects.toThrow('Empty amount');
  });

  it('throws when a 200 response is missing orderId/formUrl (no silent stuck order)', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ errorCode: 0 }), // no orderId/formUrl
    });
    const svc = new EpgService(makeConfig());
    await expect(
      svc.register({ orderNumber: 'x', amount: 500, currency: '051', returnUrl: 'a', failUrl: 'b' }),
    ).rejects.toThrow('did not return a payment URL');
  });
});

describe('EpgService.call HTTP status', () => {
  it('throws when the gateway responds with a non-2xx status', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => 'Bad Gateway',
    });
    const svc = new EpgService(makeConfig());
    await expect(svc.getOrderStatusExtended('oid-1')).rejects.toThrow('HTTP 502');
  });
});

describe('EpgService.getOrderStatusExtended', () => {
  it('parses status, action code and masked pan', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        errorCode: 0, orderStatus: 2, actionCode: 0,
        actionCodeDescription: 'Approved', cardAuthInfo: { pan: '400000**0050' },
      }),
    });
    const svc = new EpgService(makeConfig());
    const res = await svc.getOrderStatusExtended('oid-1');
    expect(res.orderStatus).toBe(2);
    expect(res.actionCodeDescription).toBe('Approved');
    expect(res.panMasked).toBe('400000**0050');
  });
});
