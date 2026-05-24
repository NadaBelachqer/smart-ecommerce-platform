import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const isGatewayRequest = req.url.startsWith('http://localhost:8080/');
  const isAuthRequest = req.url.includes('/api/auth/');

  if (!token || !isGatewayRequest || isAuthRequest) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }));
};
