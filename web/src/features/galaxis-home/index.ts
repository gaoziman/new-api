/*
 * Galaxis 定制首页。
 *
 * 整个目录是新增的，不覆盖上游任何文件；对上游的改动只有
 * routes/index.tsx 里一行 import 的替换。上游的 features/home 原封保留，
 * 既是回滚开关（改回一行即可），也让合并上游更新时不产生冲突。
 */
export { GalaxisHome } from './home'
