const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [100, 'Course title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      maxlength: [2000, 'Course description cannot exceed 2000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Instructor is required'],
    },
    category: {
      type: String,
      required: [true, 'Course category is required'],
      enum: [
        'Programming',
        'Design',
        'Business',
        'Marketing',
        'Finance',
        'Health',
        'Language',
        'Music',
        'Photography',
        'Other',
      ],
    },
    level: {
      type: String,
      required: [true, 'Course level is required'],
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    duration: {
      type: Number, // in hours
      required: [true, 'Course duration is required'],
      min: [1, 'Duration must be at least 1 hour'],
    },
    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%'],
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    images: [
      {
        type: String,
      },
    ],
    videoUrl: {
      type: String,
    },
    syllabus: [
      {
        title: String,
        description: String,
        duration: Number, // in minutes
        videoUrl: String,
        materials: [String],
      },
    ],
    requirements: [
      {
        type: String,
      },
    ],
    learningOutcomes: [
      {
        type: String,
      },
    ],
    tags: [
      {
        type: String,
      },
    ],
    maxStudents: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    currentStudents: {
      type: Number,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: [500, 'Review comment cannot exceed 500 characters'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    enrollmentDeadline: {
      type: Date,
    },
    certificate: {
      type: Boolean,
      default: false,
    },
    certificateTemplate: {
      type: String,
    },
    materials: [
      {
        title: String,
        type: String, // pdf, video, link, etc.
        url: String,
        description: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ isFeatured: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ instructor: 1 });

// Virtual for discounted price
courseSchema.virtual('discountedPrice').get(function getDiscountedPrice() {
  if (this.discount > 0) {
    return this.price - (this.price * this.discount) / 100;
  }
  return this.price;
});

// Virtual for enrollment percentage
courseSchema
  .virtual('enrollmentPercentage')
  .get(function getEnrollmentPercentage() {
    if (this.maxStudents === 0) {
      return 0;
    }
    return Math.round((this.currentStudents / this.maxStudents) * 100);
  });

// Method to update rating
courseSchema.methods.updateRating = function updateRating() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
  } else {
    const totalRating = this.reviews.reduce(function sumRatings(sum, review) {
      return sum + review.rating;
    }, 0);
    this.rating.average = totalRating / this.reviews.length;
    this.rating.count = this.reviews.length;
  }
};

// Pre-save middleware to update rating
courseSchema.pre('save', function preSaveUpdateRating(next) {
  this.updateRating();
  next();
});

module.exports = mongoose.model('Course', courseSchema);
