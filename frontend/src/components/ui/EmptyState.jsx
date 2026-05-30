import { motion } from 'framer-motion'

export default function EmptyState({
  icon: Icon,
  title,
  titleAr,
  description,
  descriptionAr,
  action,
  actionLabel,
  actionLabelAr,
  language = 'en',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-8 text-center"
    >
      {Icon && (
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20 flex items-center justify-center mb-6 shadow-lg">
          <Icon className="w-10 h-10 text-primary-500" />
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        {language === 'ar' ? (titleAr || title) : title}
      </h3>
      {(description || descriptionAr) && (
        <p className="text-gray-500 dark:text-gray-400 max-w-md text-sm leading-relaxed mb-6">
          {language === 'ar' ? (descriptionAr || description) : description}
        </p>
      )}
      {action && (
        <button onClick={action} className="btn btn-primary">
          {language === 'ar' ? (actionLabelAr || actionLabel) : actionLabel}
        </button>
      )}
    </motion.div>
  )
}
