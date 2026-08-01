'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../../../lib';
import { SettingsPage, SectionCard, Toast, EmptyState, Input, Select, Field } from '../../shared';

interface Template {
  id: string;
  name: string;
  label: string;
  subject: string;
  htmlBody: string;
  variables: { name: string; label: string; defaultValue: string }[];
  fromEmail: string | null;
  fromName: string | null;
  createdAt: string;
  updatedAt: string;
}

const PRESETS = [
  {
    name: 'welcome',
    label: 'Welcome Email',
    subject: 'Welcome to Tirbeo, {{name}}!',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .btn{display:inline-block;padding:12px 24px;background:#1A73E8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Welcome to Tirbeo, {{name}}!</h1><p>Your account is ready. Start exploring communities, connecting with people, and sharing ideas.</p><p>If you have any questions, reply to this email or visit our Help Center.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'name', label: 'User Name', defaultValue: 'John' }],
  },
  {
    name: 'signup_otp',
    label: 'Signup OTP',
    subject: 'Your Tirbeo verification code is {{otp}}',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .code{font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#1A73E8;margin:24px 0;padding:16px;background:#f0f7ff;border-radius:8px;border:1px dashed #1A73E8} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Verify your email</h1><p>Use this code to complete your signup:</p><div class="code">{{otp}}</div><p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'otp', label: 'OTP Code', defaultValue: '123456' }],
  },
  {
    name: 'login_otp',
    label: 'Login OTP',
    subject: 'Your Tirbeo login code is {{otp}}',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .code{font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#1A73E8;margin:24px 0;padding:16px;background:#f0f7ff;border-radius:8px;border:1px dashed #1A73E8} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Your login code</h1><p>Use this code to sign in to your Tirbeo account:</p><div class="code">{{otp}}</div><p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'otp', label: 'OTP Code', defaultValue: '123456' }],
  },
  {
    name: 'email_verify',
    label: 'Email Verification',
    subject: 'Verify your email address',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .code{font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#1A73E8;margin:24px 0;padding:16px;background:#f0f7ff;border-radius:8px;border:1px dashed #1A73E8} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Verify your email</h1><p>Use this code to verify your email address:</p><div class="code">{{otp}}</div><p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'otp', label: 'OTP Code', defaultValue: '123456' }],
  },
  {
    name: 'password_reset_link',
    label: 'Password Reset Link',
    subject: 'Reset your Tirbeo password',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .btn{display:inline-block;padding:12px 24px;background:#1A73E8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Reset your password</h1><p>Click the button below to reset your password. This link expires in 1 hour.</p><a href="{{resetLink}}" class="btn">Reset Password</a><p>Or copy this URL: <br/><code style="font-size:12px;word-break:break-all;background:#f0f7ff;padding:8px;border-radius:6px;border:1px solid #e8eaed;color:#1A73E8">{{resetLink}}</code></p><p>If you didn't request this, ignore this email.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'resetLink', label: 'Reset URL', defaultValue: 'https://accounts.tirbeo.app/reset?token=abc' }],
  },
  {
    name: 'password_reset_otp',
    label: 'Password Reset OTP',
    subject: 'Your Tirbeo password reset code is {{otp}}',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .code{font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#1A73E8;margin:24px 0;padding:16px;background:#f0f7ff;border-radius:8px;border:1px dashed #1A73E8} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Password reset code</h1><p>Use this code to reset your Tirbeo password:</p><div class="code">{{otp}}</div><p>This code expires in 10 minutes. If you didn't request this, ignore this email.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'otp', label: 'OTP Code', defaultValue: '123456' }],
  },
  {
    name: 'magic_link',
    label: 'Magic Link',
    subject: 'Sign in to Tirbeo without a password',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .btn{display:inline-block;padding:12px 24px;background:#1A73E8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Sign in without a password</h1><p>Click the button below to sign in to your Tirbeo account. This link expires in 15 minutes.</p><a href="{{magicLink}}" class="btn">Sign In</a><p>Or copy this URL: <br/><code style="font-size:12px;word-break:break-all;background:#f0f7ff;padding:8px;border-radius:6px;border:1px solid #e8eaed;color:#1A73E8">{{magicLink}}</code></p><p>If you didn't request this, ignore this email.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'magicLink', label: 'Magic Link URL', defaultValue: 'https://accounts.tirbeo.app/callback?magic_token=abc' }],
  },
  {
    name: 'account_recovery',
    label: 'Account Recovery',
    subject: 'Your Tirbeo account recovery code',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .code{font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#1A73E8;margin:24px 0;padding:16px;background:#f0f7ff;border-radius:8px;border:1px dashed #1A73E8} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Account recovery</h1><p>Use this code to recover your Tirbeo account:</p><div class="code">{{otp}}</div><p>This code expires in 15 minutes. If you didn't request this, ignore this email.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'otp', label: 'Recovery Code', defaultValue: '123456' }],
  },
  {
    name: 'password_changed',
    label: 'Password Changed',
    subject: 'Your Tirbeo password was changed',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .meta{background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0;font-size:14px} .meta-row{display:flex;justify-content:space-between;padding:4px 0} .meta-label{color:#5f6368} .meta-value{color:#202124;font-weight:500} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Password changed</h1><p>Your Tirbeo password was changed successfully.</p><div class="meta"><div class="meta-row"><span class="meta-label">Time</span><span class="meta-value">{{changedAt}}</span></div><div class="meta-row"><span class="meta-label">IP</span><span class="meta-value">{{ipAddress}}</span></div></div><p>If you didn't make this change, please reset your password immediately or contact support.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'changedAt', label: 'Changed At', defaultValue: 'July 30, 2026 at 2:45 PM' },
      { name: 'ipAddress', label: 'IP Address', defaultValue: '192.168.1.1' },
    ],
  },
  {
    name: 'suspicious_login',
    label: 'Suspicious Login Alert',
    subject: 'Suspicious login detected on your Tirbeo account',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .meta{background:#fff3e0;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;border:1px solid #ffe0b2} .meta-row{display:flex;justify-content:space-between;padding:4px 0} .meta-label{color:#5f6368} .meta-value{color:#202124;font-weight:500} .btn{display:inline-block;padding:12px 24px;background:#1A73E8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Suspicious login detected</h1><p>We noticed a sign-in to your Tirbeo account from an unusual location or device.</p><div class="meta"><div class="meta-row"><span class="meta-label">Location</span><span class="meta-value">{{location}}</span></div><div class="meta-row"><span class="meta-label">Device</span><span class="meta-value">{{device}}</span></div><div class="meta-row"><span class="meta-label">Time</span><span class="meta-value">{{loginTime}}</span></div><div class="meta-row"><span class="meta-label">IP</span><span class="meta-value">{{ipAddress}}</span></div></div><p>If this was you, you can ignore this alert. If not, please secure your account immediately.</p><a href="{{dashboardUrl}}" class="btn">Review Account</a><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'location', label: 'Location', defaultValue: 'San Francisco, CA' },
      { name: 'device', label: 'Device', defaultValue: 'Chrome on macOS' },
      { name: 'loginTime', label: 'Login Time', defaultValue: 'July 30, 2026 at 2:45 PM' },
      { name: 'ipAddress', label: 'IP Address', defaultValue: '192.168.1.1' },
      { name: 'dashboardUrl', label: 'Dashboard URL', defaultValue: 'https://tirbeo.app/dashboard' },
    ],
  },
  {
    name: 'login_alert',
    label: 'New Login Alert',
    subject: 'New sign-in to your Tirbeo account',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .meta{background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0;font-size:14px} .meta-row{display:flex;justify-content:space-between;padding:4px 0} .meta-label{color:#5f6368} .meta-value{color:#202124;font-weight:500} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>New sign-in detected</h1><p>A new sign-in was detected on your Tirbeo account.</p><div class="meta"><div class="meta-row"><span class="meta-label">Location</span><span class="meta-value">{{location}}</span></div><div class="meta-row"><span class="meta-label">Device</span><span class="meta-value">{{device}}</span></div><div class="meta-row"><span class="meta-label">Time</span><span class="meta-value">{{loginTime}}</span></div></div><p>If this wasn't you, please change your password immediately.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'location', label: 'Location', defaultValue: 'San Francisco, CA' },
      { name: 'device', label: 'Device', defaultValue: 'Chrome on macOS' },
      { name: 'loginTime', label: 'Login Time', defaultValue: 'July 30, 2026 at 2:45 PM' },
    ],
  },
  {
    name: 'admin_alert',
    label: 'Admin Alert',
    subject: '[Admin] {{subject}}',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .meta{background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0;font-size:14px} .meta-row{display:flex;justify-content:space-between;padding:4px 0} .meta-label{color:#5f6368} .meta-value{color:#202124;font-weight:500} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Admin Alert</h1><p>{{message}}</p><div class="meta">{{details}}</div><div class="footer">Sent by Tirbeo Admin &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'subject', label: 'Subject', defaultValue: 'System Alert' },
      { name: 'message', label: 'Message', defaultValue: 'An admin action was performed.' },
      { name: 'details', label: 'Details HTML', defaultValue: '<p>No additional details.</p>' },
    ],
  },
  {
    name: 'system_alert',
    label: 'System Alert',
    subject: '[System] {{subject}}',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .meta{background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0;font-size:14px} .meta-row{display:flex;justify-content:space-between;padding:4px 0} .meta-label{color:#5f6368} .meta-value{color:#202124;font-weight:500} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>System Alert</h1><p>{{message}}</p><div class="meta"><div class="meta-row"><span class="meta-label">Service</span><span class="meta-value">{{service}}</span></div><div class="meta-row"><span class="meta-label">Time</span><span class="meta-value">{{alertTime}}</span></div></div><div class="footer">Sent by Tirbeo System &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'subject', label: 'Subject', defaultValue: 'Service Degraded' },
      { name: 'message', label: 'Message', defaultValue: 'We are investigating an issue with the API service.' },
      { name: 'service', label: 'Service', defaultValue: 'API' },
      { name: 'alertTime', label: 'Alert Time', defaultValue: 'July 30, 2026 at 3:00 PM' },
    ],
  },
  {
    name: 'notification_digest',
    label: 'Notification Digest',
    subject: 'Your Tirbeo digest — {{count}} new updates',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .item{padding:12px 0;border-bottom:1px solid #f0f0f0} .btn{display:inline-block;padding:12px 24px;background:#1A73E8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Your Digest</h1><p>You have <strong>{{count}}</strong> new updates since your last visit.</p>{{digestItems}}<a href="{{dashboardUrl}}" class="btn">View All</a><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'count', label: 'Notification Count', defaultValue: '5' },
      { name: 'digestItems', label: 'HTML Items', defaultValue: '<p>...</p>' },
      { name: 'dashboardUrl', label: 'Dashboard URL', defaultValue: 'https://tirbeo.app/dashboard' },
    ],
  },
  {
    name: 'invoice',
    label: 'Invoice / Receipt',
    subject: 'Your Tirbeo receipt — {{plan}}',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .table{width:100%;border-collapse:collapse;margin:16px 0} .table td{padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Receipt</h1><p>Thank you for your payment, {{name}}.</p><table class="table"><tr><td>Plan</td><td><strong>{{plan}}</strong></td></tr><tr><td>Amount</td><td><strong>{{amount}}</strong></td></tr><tr><td>Date</td><td><strong>{{date}}</strong></td></tr></table><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'name', label: 'User Name', defaultValue: 'John' },
      { name: 'plan', label: 'Plan Name', defaultValue: 'Pro Monthly' },
      { name: 'amount', label: 'Amount', defaultValue: '$19.99' },
      { name: 'date', label: 'Date', defaultValue: 'July 9, 2026' },
    ],
  },
  {
    name: 'form_response',
    label: 'Form Response Notification',
    subject: 'New response to "{{formTitle}}"',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .meta{background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0;font-size:14px} .meta-row{display:flex;justify-content:space-between;padding:4px 0} .meta-label{color:#5f6368} .meta-value{color:#202124;font-weight:500} .answers{margin:16px 0} .answer-item{padding:12px 0;border-bottom:1px solid #f0f0f0} .answer-label{font-size:12px;color:#5f6368;margin-bottom:4px} .answer-value{font-size:14px;color:#202124} .btn{display:inline-block;padding:12px 24px;background:#1A73E8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>New Form Response</h1><p>A new response has been submitted to your form <strong>{{formTitle}}</strong>.</p><div class="meta"><div class="meta-row"><span class="meta-label">Respondent</span><span class="meta-value">{{respondentName}} ({{respondentEmail}})</span></div><div class="meta-row"><span class="meta-label">Submitted</span><span class="meta-value">{{submittedAt}}</span></div><div class="meta-row"><span class="meta-label">Response ID</span><span class="meta-value">{{responseId}}</span></div></div><h2 style="font-size:16px;color:#202124;margin:16px 0 8px">Responses</h2><div class="answers">{{answers}}</div><a href="{{adminUrl}}" class="btn">View in Admin</a><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'formTitle', label: 'Form Title', defaultValue: 'Customer Survey' },
      { name: 'respondentName', label: 'Respondent Name', defaultValue: 'Jane Doe' },
      { name: 'respondentEmail', label: 'Respondent Email', defaultValue: 'jane@example.com' },
      { name: 'submittedAt', label: 'Submitted At', defaultValue: 'July 30, 2026' },
      { name: 'responseId', label: 'Response ID', defaultValue: 'resp_abc123' },
      { name: 'answers', label: 'Answers HTML', defaultValue: '<p>Field values here</p>' },
      { name: 'adminUrl', label: 'Admin URL', defaultValue: 'https://admin.tirbeo.app/forms/responses' },
    ],
  },
  {
    name: 'form_submission_confirmation',
    label: 'Form Submission Confirmation',
    subject: 'Thank you for your response to "{{formTitle}}"',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .check{width:48px;height:48px;border-radius:50%;background:#e8f5e9;display:flex;align-items:center;justify-content:center;margin:0 auto 16px} .check svg{width:24px;height:24px;color:#188038} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><div class="check"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><h1>Thank You!</h1><p>Your response to <strong>{{formTitle}}</strong> has been recorded successfully.</p><p>If you have any questions, feel free to reach out to the form owner.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'formTitle', label: 'Form Title', defaultValue: 'Customer Survey' },
      { name: 'respondentName', label: 'Respondent Name', defaultValue: 'Jane Doe' },
    ],
  },
  {
    name: 'form_published',
    label: 'Form Published',
    subject: 'Your form "{{formTitle}}" is now live',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .btn{display:inline-block;padding:12px 24px;background:#1A73E8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Form is now live</h1><p>Your form <strong>{{formTitle}}</strong> has been published and is now accepting responses.</p><a href="{{formUrl}}" class="btn">View Form</a><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'formTitle', label: 'Form Title', defaultValue: 'Customer Survey' },
      { name: 'formUrl', label: 'Form URL', defaultValue: 'https://forms.tirbeo.app/f/abc123' },
    ],
  },
  {
    name: 'form_closed',
    label: 'Form Closed',
    subject: 'Your form "{{formTitle}}" has been closed',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Form closed</h1><p>Your form <strong>{{formTitle}}</strong> has been closed and is no longer accepting responses.</p><p>You can reopen it anytime from your dashboard.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'formTitle', label: 'Form Title', defaultValue: 'Customer Survey' }],
  },
  {
    name: 'form_deleted',
    label: 'Form Deleted',
    subject: 'Your form "{{formTitle}}" has been deleted',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Form deleted</h1><p>Your form <strong>{{formTitle}}</strong> has been permanently deleted.</p><p>This action cannot be undone. If this was a mistake, please contact support.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'formTitle', label: 'Form Title', defaultValue: 'Customer Survey' }],
  },
  {
    name: 'form_archived',
    label: 'Form Archived',
    subject: 'Your form "{{formTitle}}" has been archived',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Form archived</h1><p>Your form <strong>{{formTitle}}</strong> has been archived.</p><p>Archived forms are hidden from your dashboard but can be restored anytime.</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'formTitle', label: 'Form Title', defaultValue: 'Customer Survey' }],
  },
  {
    name: 'response_updated',
    label: 'Response Updated',
    subject: 'A response to "{{formTitle}}" was updated',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Response updated</h1><p>A response to your form <strong>{{formTitle}}</strong> was updated.</p><p>Response ID: {{responseId}}<br/>Updated at: {{updatedAt}}</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'formTitle', label: 'Form Title', defaultValue: 'Customer Survey' },
      { name: 'responseId', label: 'Response ID', defaultValue: 'resp_abc123' },
      { name: 'updatedAt', label: 'Updated At', defaultValue: 'July 30, 2026' },
    ],
  },
  {
    name: 'response_deleted',
    label: 'Response Deleted',
    subject: 'A response to "{{formTitle}}" was deleted',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Response deleted</h1><p>A response to your form <strong>{{formTitle}}</strong> was deleted.</p><p>Response ID: {{responseId}}<br/>Deleted at: {{deletedAt}}</p><div class="footer">Sent by Tirbeo &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'formTitle', label: 'Form Title', defaultValue: 'Customer Survey' },
      { name: 'responseId', label: 'Response ID', defaultValue: 'resp_abc123' },
      { name: 'deletedAt', label: 'Deleted At', defaultValue: 'July 30, 2026' },
    ],
  },
  {
    name: 'ticket_created',
    label: 'Support Ticket Created',
    subject: 'Support ticket opened: {{ticketSubject}}',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .meta{background:#f0f7ff;border-radius:8px;padding:16px;margin:16px 0;font-size:14px} .meta-row{display:flex;justify-content:space-between;padding:4px 0} .meta-label{color:#5f6368} .meta-value{color:#202124;font-weight:500} .btn{display:inline-block;padding:12px 24px;background:#1A73E8;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Support ticket opened</h1><p>Your support ticket has been created.</p><div class="meta"><div class="meta-row"><span class="meta-label">Ticket</span><span class="meta-value">{{ticketId}}</span></div><div class="meta-row"><span class="meta-label">Subject</span><span class="meta-value">{{ticketSubject}}</span></div><div class="meta-row"><span class="meta-label">Status</span><span class="meta-value">{{ticketStatus}}</span></div></div><a href="{{ticketUrl}}" class="btn">View Ticket</a><div class="footer">Sent by Tirbeo Support &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'ticketId', label: 'Ticket ID', defaultValue: 'TKT-001' },
      { name: 'ticketSubject', label: 'Ticket Subject', defaultValue: 'Need help with login' },
      { name: 'ticketStatus', label: 'Ticket Status', defaultValue: 'Open' },
      { name: 'ticketUrl', label: 'Ticket URL', defaultValue: 'https://support.tirbeo.app/tickets/TKT-001' },
    ],
  },
  {
    name: 'ticket_updated',
    label: 'Support Ticket Updated',
    subject: 'Update on your support ticket {{ticketId}}',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Ticket updated</h1><p>Your support ticket <strong>{{ticketId}}</strong> has been updated.</p><p>{{updateMessage}}</p><a href="{{ticketUrl}}" class="btn">View Ticket</a><div class="footer">Sent by Tirbeo Support &mdash; tirbeo.app</div></div></body></html>`,
    variables: [
      { name: 'ticketId', label: 'Ticket ID', defaultValue: 'TKT-001' },
      { name: 'updateMessage', label: 'Update Message', defaultValue: 'An agent replied to your ticket.' },
      { name: 'ticketUrl', label: 'Ticket URL', defaultValue: 'https://support.tirbeo.app/tickets/TKT-001' },
    ],
  },
  {
    name: 'ticket_closed',
    label: 'Support Ticket Closed',
    subject: 'Your support ticket {{ticketId}} has been closed',
    htmlBody: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f6f8fa;margin:0;padding:32px 16px} .card{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8eaed} .logo{width:40px;height:40px;border-radius:10px;background:#1A73E8;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:24px} h1{font-size:24px;color:#202124;margin:0 0 8px} p{color:#5f6368;font-size:14px;line-height:1.6} .footer{font-size:12px;color:#80868b;margin-top:32px;border-top:1px solid #e8eaed;padding-top:16px}</style></head><body><div class="card"><div class="logo">T</div><h1>Ticket closed</h1><p>Your support ticket <strong>{{ticketId}}</strong> has been closed.</p><p>If you still need help, feel free to open a new ticket.</p><div class="footer">Sent by Tirbeo Support &mdash; tirbeo.app</div></div></body></html>`,
    variables: [{ name: 'ticketId', label: 'Ticket ID', defaultValue: 'TKT-001' }],
  },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [preset, setPreset] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newHtml, setNewHtml] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const load = async () => {
    const res = await apiFetch('/api/admin/email/templates');
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteTpl = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const res = await apiFetch(`/api/admin/email/templates/${id}`, { method: 'DELETE' });
    if (res.ok) { setMsg({ type: 'success', text: 'Template deleted' }); load(); }
    else setMsg({ type: 'error', text: 'Delete failed' });
    setTimeout(() => setMsg(null), 3000);
  };

  const createFromPreset = async () => {
    const p = PRESETS.find(x => x.name === preset);
    if (!p) return;
    const res = await apiFetch('/api/admin/email/templates', {
      method: 'POST',
      body: JSON.stringify({ name: p.name, label: newLabel || p.label, subject: newSubject || p.subject, htmlBody: newHtml || p.htmlBody, variables: p.variables }),
    });
    if (res.ok) { setMsg({ type: 'success', text: 'Template created' }); setShowCreate(false); load(); }
    else { const e = await res.json(); setMsg({ type: 'error', text: e.error || 'Create failed' }); }
    setTimeout(() => setMsg(null), 3000);
  };

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <SettingsPage title="Email Templates" desc="Manage HTML email templates with variable placeholders">
      <Toast msg={msg} onClose={() => setMsg(null)} />

      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Template'}
        </button>
      </div>

      {showCreate && (
        <SectionCard title="Create from Preset">
          <Field label="Preset">
            <Select value={preset} onChange={e => {
              setPreset(e.target.value);
              const p = PRESETS.find(x => x.name === e.target.value);
              if (p) { setNewLabel(p.label); setNewSubject(p.subject); setNewHtml(p.htmlBody); }
            }}>
              <option value="">Select a preset</option>
              {PRESETS.map(p => <option key={p.name} value={p.name}>{p.label}</option>)}
            </Select>
          </Field>
          {preset && (
            <>
              <Field label="Label">
                <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} />
              </Field>
              <Field label="Subject">
                <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} />
              </Field>
              <Field label="HTML Body">
                <textarea className="textarea" rows={8} value={newHtml} onChange={e => setNewHtml(e.target.value)} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              </Field>
              <button className="btn btn-primary" onClick={createFromPreset}>Create Template</button>
            </>
          )}
        </SectionCard>
      )}

      {templates.length === 0 && !showCreate ? (
        <EmptyState text="No email templates yet. Create one to get started." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Label</th>
                <th>Subject</th>
                <th>Variables</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id}>
                  <td><code style={{ fontSize: 12, color: 'var(--accent)' }}>{t.name}</code></td>
                  <td>{t.label}</td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                  <td>{(t.variables as Array<{ name: string }>)?.length || 0}</td>
                  <td>
                    <div className="flex gap-1">
                      <a href={`/settings/email/templates/${t.id}`} className="btn btn-outline btn-sm">Edit</a>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteTpl(t.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsPage>
  );
}
