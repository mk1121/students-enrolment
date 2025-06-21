const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  startDate: {
    type: Date
  },
  completionDate: {
    type: Date
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedLessons: [{
    lessonId: String,
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'Incomplete'],
    default: 'Incomplete'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  certificate: {
    issued: {
      type: Boolean,
      default: false
    },
    issuedDate: Date,
    certificateId: String,
    certificateUrl: String
  },
  payment: {
    amount: {
      type: Number,
      required: [true, 'Payment amount is required']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'bank_transfer', 'cash'],
      required: [true, 'Payment method is required']
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentDate: Date,
    transactionId: String,
    refundAmount: {
      type: Number,
      default: 0
    },
    refundDate: Date,
    refundReason: String
  },
  notes: {
    student: [{
      note: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    admin: [{
      note: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentDate: 1 });
enrollmentSchema.index({ 'payment.paymentStatus': 1 });

// Virtual for enrollment duration
enrollmentSchema.virtual('duration').get(function() {
  if (this.startDate && this.completionDate) {
    return Math.ceil((this.completionDate - this.startDate) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Virtual for isCompleted
enrollmentSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for isActive
enrollmentSchema.virtual('isEnrollmentActive').get(function() {
  return this.status === 'active' && this.isActive;
});

// Method to update progress
enrollmentSchema.methods.updateProgress = function(completedLessons, totalLessons) {
  if (totalLessons > 0) {
    this.progress = Math.round((completedLessons / totalLessons) * 100);
  }
  
  if (this.progress >= 100 && this.status === 'active') {
    this.status = 'completed';
    this.completionDate = new Date();
  }
};

// Method to add completed lesson
enrollmentSchema.methods.addCompletedLesson = function(lessonId) {
  const existingLesson = this.completedLessons.find(lesson => lesson.lessonId === lessonId);
  if (!existingLesson) {
    this.completedLessons.push({ lessonId });
  }
};

// Method to issue certificate
enrollmentSchema.methods.issueCertificate = function() {
  if (this.status === 'completed' && !this.certificate.issued) {
    this.certificate.issued = true;
    this.certificate.issuedDate = new Date();
    this.certificate.certificateId = `CERT-${this._id}-${Date.now()}`;
    // Generate certificate URL logic here
  }
};

// Pre-save middleware to update last accessed
enrollmentSchema.pre('save', function(next) {
  this.lastAccessed = new Date();
  next();
});

module.exports = mongoose.model('Enrollment', enrollmentSchema); 