import {
  Component,
  inject,
  input,
  signal,
  computed,
  type OnInit,
} from "@angular/core";
import { DatePipe, DecimalPipe } from "@angular/common";
import { FeedbackStore } from "../../state/feedback/feedback.store";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-feedback-list",
  imports: [DatePipe, DecimalPipe, ButtonModule],
  templateUrl: "./feedback-list.component.html",
})
export class FeedbackListComponent implements OnInit {
  readonly businessId = input.required<string>();

  private readonly feedbackStore = inject(FeedbackStore);

  readonly feedbacks = this.feedbackStore.feedbacks;
  readonly isLoading = this.feedbackStore.isLoading;
  readonly error = this.feedbackStore.error;

  // Selected filter: null for all ratings, or specific rating number (1, 2, 3)
  readonly ratingFilter = signal<number | null>(null);

  readonly filteredFeedbacks = computed(() => {
    const all = this.feedbacks();
    const filter = this.ratingFilter();
    if (filter === null) {
      return all;
    }
    return all.filter((f) => f.rating === filter);
  });

  readonly averageRating = computed(() => {
    const list = this.feedbacks();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, f) => acc + f.rating, 0);
    return sum / list.length;
  });

  readonly statsBreakdown = computed(() => {
    const list = this.feedbacks();
    const counts = { 1: 0, 2: 0, 3: 0 };
    list.forEach((f) => {
      if (f.rating === 1 || f.rating === 2 || f.rating === 3) {
        counts[f.rating]++;
      }
    });
    return counts;
  });

  ngOnInit() {
    this.feedbackStore.loadFeedbacks(this.businessId());
  }

  setFilter(rating: number | null) {
    this.ratingFilter.set(rating);
  }

  getStarsArray(rating: number): number[] {
    return Array(rating).fill(0);
  }

  getEmptyStarsArray(rating: number): number[] {
    return Array(5 - rating).fill(0);
  }
}
