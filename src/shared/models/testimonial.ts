/**
 * Testimonial Model - Not used in dashboard
 * This file exists only to prevent build errors from legacy subtitle extract code
 */

export enum TestimonialStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface Testimonial {
  id: string;
  userId?: string;
  name?: string;
  role?: string;
  quote?: string;
  language?: string;
  status?: TestimonialStatus;
  rating?: number;
  createdAt?: Date;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface GetTestimonialsParams {
  status?: TestimonialStatus;
  language?: string;
  getUser?: boolean;
  page?: number;
  limit?: number;
}

export async function getTestimonials(params: GetTestimonialsParams = {}): Promise<Testimonial[]> {
  // Testimonials are not available in dashboard
  return [];
}

export async function getTestimonialsCount(params: { status?: TestimonialStatus; language?: string } = {}): Promise<number> {
  // Testimonials are not available in dashboard
  return 0;
}

export async function findTestimonialById(id: string): Promise<Testimonial | null> {
  // Testimonials are not available in dashboard
  return null;
}

export async function createTestimonial(data: Partial<Testimonial>): Promise<Testimonial> {
  throw new Error('Testimonials are not available in dashboard');
}

export async function updateTestimonialById(id: string, data: Partial<Testimonial>): Promise<void> {
  // Testimonials are not available in dashboard
  // No-op
}

export async function deleteTestimonialById(id: string): Promise<void> {
  // Testimonials are not available in dashboard
  // No-op
}

