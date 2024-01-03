# frozen_string_literal: true

# capture the stdout of a given block
# @yield the block to capture stdout from
# @return [String] the stdout of the block
public def capture_stdout
  original_stdout = $stdout
  $stdout = StringIO.new
  yield
  $stdout.string
ensure
  $stdout = original_stdout
  ""
end
